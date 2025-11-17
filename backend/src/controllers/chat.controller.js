const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const Group = require("../models/group.model");
const User = require("../models/user.model");
const cloudinary = require("../lib/cloudinary");
const { getIO, getSocketID } = require("../lib/socket");

/* ---------- helper functions for population ------------ */

const populateMessage = async (query) => {
    return Message.findOne(query)
        .select("-_id -__v")
        .populate([
            {
                path: "sender", // populate sender infos
                model: "User",
                localField: "sender",
                foreignField: "userID",
                select: "userID name profilePic",
            },
            {
                path: "replyTo", // populate replyTo message
                model: "Message",
                localField: "replyTo",
                foreignField: "messageID",
                select: "messageID text image groupInvite sender",
                populate: {
                    path: "sender", // nested populate: replyTo message sender 
                    model: "User",
                    localField: "sender",
                    foreignField: "userID",
                    select: "userID name",
                },
            },
            {
                path: "groupInvite", // populate groupInvite infos
                model: "Group",
                localField: "groupInvite",
                foreignField: "groupID",
                select: "groupID name image members",
            }
        ])
        .lean();
}

/* ---------- getting chat details ------------ */

// get paginated chats for the authenticated user.
const getChats = async (req, res) => {
    try {
        const userID = req.user.userID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        // parallel queries for optimization
        const [total, chats] = await Promise.all([
            // count total number of chats the user participates in
            Chat.countDocuments({participants: userID}),

            // fetch chats (newest first), with pagination, lastMessage & group populated
            Chat.find({ participants: userID })
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select("-_id -__v")
            .populate([
                {   
                    path: "lastMessage", // populate last message infos
                    model: "Message",
                    localField: "lastMessage", 
                    foreignField: "messageID", 
                    justOne: true,
                    select: "-_id -__v  -chatID", // exclude unnecessary fields
                    populate: { 
                        path: "sender", // populate last message sender
                        model: "User",
                        localField: "sender", 
                        foreignField: "userID",
                        justOne: true,
                        select: "userID name profilePic lastSeen isDeleted"
                    }
                },
                {
                    path: "group", // populate group if it's a group chat
                    model: "Group",
                    localField: "group",
                    foreignField: "groupID",
                    justOne: true,
                    select: "groupID name image"
                }
            ])
            .lean()
        ])

        // add participant infos for private chats only
        await Promise.all(chats.map(async (chat) => {
            if (!chat.isGroup) {
                chat.participants = await User.find(
                    { userID: { $in: chat.participants } },
                    "userID name profilePic lastSeen isDeleted"
                ).lean();
            }
        }));

        // return paginated response
        res.json({
            totalPages: Math.ceil(total / limit),
            chats
        });
        
    } catch (error) {
        console.error("Error in get chats controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

// get paginated messages for a specefic chat.
const getChatMessages = async (req, res) => {
    try {
        const userID = req.user.userID;
        const chatID = parseInt(req.params.chatID);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        // validate chat existence
        const chat = await Chat.findOne({chatID}).select("participants").lean();
        if(!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // validate user participation in chat
        if(!chat.participants.includes(userID)) {
            return res.status(403).json({ message: "You are not a participant of this chat" });
        }

        const [total, messages] = await Promise.all([
            // count total number of messages in this chat
            Message.countDocuments({ chatID }),

            // fetch messages (newest first), with pagination, sender & replyTo & groupInvite populated
            Message.find({ chatID })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select("-_id -__v")
            .populate([
                {   
                    path: "sender", // populate sender infos
                    model: "User",
                    localField: "sender", 
                    foreignField: "userID",
                    justOne: true,
                    select: "userID name profilePic", // select only necessary fields
                },
                {
                    path: "replyTo", // populate replyTo message infos 
                    model: "Message",
                    localField: "replyTo", 
                    foreignField: "messageID",
                    justOne: true,
                    select: "messageID text image groupInvite sender isDeleted", 
                    populate: [{
                        path: "sender", // nested populate: sender of replyTo message
                        model: "User",
                        localField: "sender", 
                        foreignField: "userID",
                        justOne: true,
                        select: "userID name",
                    }],
                },
                {
                    path: "groupInvite", // populate groupInvite infos 
                    model: "Group",
                    localField: "groupInvite", 
                    foreignField: "groupID",
                    justOne: true,
                    select: "groupID name image members",
                }
            ])
            .lean()
        ])

        // return paginated response
        res.json({
            totalPages: Math.ceil(total / limit),
            messages
        });

    } catch (error) {
        console.error("Error in get chat messages controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

// get private chat between authenticated user and a specefic user.
const getPrivateChat = async (req, res) => {
    try {
        const userID = req.user.userID;
        const otherUserID = parseInt(req.params.userID);

        // prevent chatting with yourself
        if (userID === otherUserID) {
            return res.status(400).json({ message: "Cannot chat with yourself" });
        }

        // fetch both users infos
        const [user, otherUser] = await Promise.all([
            User.findOne({ userID }).select("userID name profilePic lastSeen isDeleted").lean(),
            User.findOne({ userID: otherUserID }).select("userID name profilePic lastSeen isDeleted").lean()
        ]);

        // stop if either user doesn’t exist 
        if (!user || !otherUser) {
            return res.status(404).json({ message: "One or both users not found" });
        }

        // find private chat if it already exists, participants is populated
        const chat = await Chat.findOne({
            isGroup: false, // private chat only
            participants: { $all: [userID, otherUserID] },
        })
        .select("-_id -__v")
        .populate({
            path: "participants",
            model: "User",
            localField: "participants", 
            foreignField: "userID",
            select: "userID name profilePic lastSeen isDeleted"
        })
        .lean();

        // create placeholder with participants (if chat doesn't exist) 
        const placeholder = {
            isGroup: false,
            participants: [user, otherUser],
            group: null
        }

        // return existing chat or placeholder
        res.json({ chat: chat || placeholder });

    } catch (error) {
        console.error("Error in get private chat controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

// Get group chat of authenticated user in a specefic group.
const getGroupChat = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);

        // validate group existence
        const group = await Group.findOne({ groupID }).select("groupID members").lean();
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // validate user membership
        const isMember = group.members.some(m => m.user === userID);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        // fetch group chat, participants & group populated
        const chat = await Chat.findOne({ isGroup: true, group: groupID })
        .select("-_id -__v")
        .populate([
            {
                path: "participants",
                model: "User",
                localField: "participants",
                foreignField: "userID",
                select: "userID name profilePic lastSeen isDeleted"
            },
            {
                path: "group",
                model: "Group",
                localField: "group",
                foreignField: "groupID",
                select: "groupID name image members"
            }
        ])
        .lean();;

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        res.json({ chat });
    } catch (error) {
        console.error("Error in get group chat controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

/* ********** managing messages ********** */

// mark messages as seen by the user in a specefic chat.
const markMessagesAsSeen = async (req, res) => {
    try {
        const userID = req.user.userID;
        const chatID = parseInt(req.params.chatID);

        // find chat, lastMessage & group populated 
        const chat = await Chat.findOne({chatID})
            .select("-_id -__v")
            .populate([
                {
                    path: "group",  // populate group if it's a group chat
                    model: "Group",
                    localField: "group",
                    foreignField: "groupID",
                    select: "groupID name image members"
                },
                {
                    path: "lastMessage", // populate last message infos
                    model: "Message",
                    localField: "lastMessage",
                    foreignField: "messageID",
                    justOne: true,
                    select: "-_id -__v -chatID",
                    populate: {
                        path: "sender", // nested populate: last message sender infos
                        model: "User",
                        localField: "sender",
                        foreignField: "userID",
                        select: "userID name profilePic lastSeen isDeleted"
                    }
                }
            ])
            .lean();

        // validate chat existence
        if(!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // validate user participation
        if(!chat.participants.includes(userID)) {
            return res.status(403).json({ message: "You are not a participant of this chat" });
        }

        // populate participants if it's a private chat
        if(!chat.isGroup) {
            const participantsData = await User.find(
                { userID: { $in: chat.participants } },
                "userID name profilePic lastSeen isDeleted"
            ).lean();
            chat.participants = participantsData;  
        } 

        // mark unseen messages as seen by the user (bulk update)
        const date = new Date();
        await Message.updateMany(
            {
                chatID,
                "seenBy.user": { $ne: userID }
            },
            { $addToSet: { seenBy: { user: userID, seenAt: date } } }
        );

        // update chat for frontend sync
        if (chat.lastMessage) {
            chat.lastMessage.seenBy = chat.lastMessage.seenBy || [];
            chat.lastMessage.seenBy.push({ user: userID, seenAt: date });
        }

        // send real time update to the receiver
        const io = getIO();

        chat.participants.forEach((user) => {
            const receiverID = chat.isGroup ? user : user.userID;
            
            if(receiverID == userID) return;
            
            const socketID = getSocketID(receiverID);
            if(socketID) {
                io.to(socketID).emit("seenMessages", {
                    chat,
                    user: userID,
                    seenAt: date,
                });
            }
        });

        return res.status(200).json({ message: "all messages marked as seen", chat, seenAt: date });
    } catch (error) {
        console.error("Error in mark message as seen controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

// send a message to a specefic chat
const sendMessage = async (req, res) => {
    try {
        const senderID = req.user.userID;
        const {chatID, receiverID, text, image, replyTo} = req.body 

        // validate message content (can't be empty)
        if(!text && !image) {
            return res.status(400).json({ message: "Cannot send empty message" });
        }

        let chat;
        
        // case 1: chatID is provided (directly sending in an existing chat)
        if(chatID) {
            // validate chat existence 
            chat = await Chat.findOne({ chatID });
            if(!chat) {
                return res.status(404).json({ message: "Chat not found" });
            }

            // validate user participation in chat 
            if (!chat.participants.includes(senderID)) {
                return res.status(403).json({ message: "You're not part of this chat" });
            }

        } else if(receiverID) { // case 2: no chatID but receiverID provided (private chat)
            
            // check if a chat already exists between the two users            
            chat = await Chat.findOne({
                isGroup: false,
                participants: { $all: [senderID, receiverID] }
            });

             // if no existing chat then create a new one
            if(!chat) {
                chat = new Chat({
                    isGroup: false,
                    participants: [senderID, receiverID],
                    updatedAt: new Date()
                });
                await chat.save();
            }
        } else {
            // neither chatID nor receiverID provided (invalid request)
            return res.status(400).json({ message: "chatID or receiverID must be provided" });
        }

        // handle replying to a message
        if(replyTo) {
            // validate original message existence
            const refMessage = await Message.findOne({ messageID: replyTo});
            if(!refMessage) {
                return res.status(400).json({ message: "Cannot reply to non existing message" });
            }

            // prevent replying to messages from different chats
            if (refMessage.chatID !== chat.chatID) {
                return res.status(400).json({ message: "Cannot reply to a message from a different chat" });
            }
        }

        // handle image upload
        let imageUrl = '';
        if(image) {
            // upload image to cloudinary
            console.log("uploading message image");
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "messages"
            });
            console.log("image uploaded");
            imageUrl = uploadResponse.secure_url; // store url
        }

        const date = new Date();
        // create and save message
        const message = new Message({
            chatID: chat.chatID,
            sender: senderID,
            text,
            image: imageUrl,
            replyTo,
            seenBy: [{user: senderID, seenAt: date}]
        });
        await message.save();

        // update chat with lastMessage and updatedAt
        chat = await Chat.findOneAndUpdate( 
            { chatID: chat.chatID }, 
            { $set: { lastMessage: message.messageID, updatedAt: date } }
        ).select("-_id -__v")
         .populate([
            {
                path: "group",  // populate group if it's a group chat
                model: "Group",
                localField: "group",
                foreignField: "groupID",
                select: "groupID name image members"
            },
            {
                path: "lastMessage", // populate last message infos
                model: "Message",
                localField: "lastMessage",
                foreignField: "messageID",
                justOne: true,
                select: "-_id -__v -chatID",
                populate: {
                    path: "sender", // nested populate: last message sender infos
                    model: "User",
                    localField: "sender",
                    foreignField: "userID",
                    select: "userID name profilePic lastSeen isDeleted"
                }
            }
         ])
         .lean();

        // populate participants if it's a private chat
        if(!chat.isGroup) {
            const participantsData = await User.find(
                { userID: { $in: chat.participants } },
                "userID name profilePic lastSeen isDeleted"
            ).lean();
            chat.participants = participantsData;  
        } 
        
        // populate data to send to frontend
        const newMessage = await populateMessage({messageID: message.messageID});

        // send real time update to the receiver
        const io = getIO();

        chat.participants.forEach((user) => {
            const userID = chat.isGroup ? user : user.userID;
            
            if(userID == senderID) return;
            
            const socketID = getSocketID(userID);
            if(socketID) {
                io.to(socketID).emit("newMessage", {
                    chat: chat,
                    message: newMessage,
                    updatedAt: date,
                });
            }
        });

        // send response to the sender
        res.status(201).json({ message: "Message sent", chat, newMessage, updatedAt: date});
    } catch (error) {
        console.error("Error in send message controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

// send group invites to a list of friends
const sendGroupInvites = async (req, res) => {
  try {
    const senderID = req.user.userID;
    const { receiverIDs, groupInvite } = req.body;

    // validate receivers array (can't be empty)
    if (!Array.isArray(receiverIDs) || receiverIDs.length === 0) {
      return res.status(400).json({ message: "At least one receiverID must be provided" });
    }

    // validate groupInvite (can't be empty)
    if (!groupInvite) {
      return res.status(400).json({ message: "Cannot send empty invite" });
    }

    // validate group existence
    const group = await Group.findOne({ groupID: groupInvite }).select("members").lean();
    if (!group) {
      return res.status(400).json({ message: "Group invite is invalid" });
    }

    // valiodate user membership in group
    const isMember = group.members.some(m => m.user == senderID);
    if (!isMember) {
      return res.status(403).json({ message: "Only group members can send invites" });
    }

    // success and failure counters 
    let successful = 0;
    let failed = 0;

    // process invites in parallel
    const invites = await Promise.all(receiverIDs.map(async (receiverID) => {  
      try {
        // find or create chat
        let chat = await Chat.findOne({
          isGroup: false,
          participants: { $all: [senderID, receiverID] }
        });

        if (!chat) {
          chat = new Chat({
            isGroup: false,
            participants: [senderID, receiverID],
            updatedAt: new Date()
          });
          await chat.save();
        }

        // create and save invite message
        const date = new Date();
        const message = new Message({
          chatID: chat.chatID,
          sender: senderID,
          groupInvite,
          seenBy: [{ user: senderID, seenAt: date }]
        });
        await message.save();

        // udpate chat infos
        chat = await Chat.findOneAndUpdate(
            { chatID: chat.chatID },
            { $set: { lastMessage: message.messageID, updatedAt: date } }
        ).select("-_id -__v")
         .populate([
            {
                path: "group",  // populate group if it's a group chat
                model: "Group",
                localField: "group",
                foreignField: "groupID",
                select: "groupID name image members"
            },
            {
                path: "lastMessage", // populate last message infos
                model: "Message",
                localField: "lastMessage",
                foreignField: "messageID",
                justOne: true,
                select: "-_id -__v -chatID",
                populate: {
                    path: "sender", // nested populate: last message sender infos
                    model: "User",
                    localField: "sender",
                    foreignField: "userID",
                    select: "userID name profilePic lastSeen isDeleted"
                }
            }
         ])
         .lean();

        // populate message for response
        const newMessage = await populateMessage({ messageID: message.messageID })
        
        // send real time update to the receiver
        const io = getIO();

        chat.participants.forEach((userID) => {
            if(userID == senderID) return;
            
            const socketID = getSocketID(userID);
            if(socketID) {
                io.to(socketID).emit("newMessage", {
                    chat: chat,
                    message: newMessage,
                    updatedAt: date,
                });
            }
        });

        // increment success
        successful++;
        return newMessage;

      } catch (err) {
        // increment fail
        failed++;
        console.log("an error occured ", err.message);
        return null;
      }
    }));

    // return response
    res.status(201).json({
      message: "Group invites processed",
      successful,
      failed,
      invites
    });

  } catch (error) {
    console.error("Error in sendGroupInvites controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// edit existing message
const editMessage = async (req, res) => {
    try {
        const userID = req.user.userID;
        const messageID = parseInt(req.params.messageID);
        const { newText } = req.body

        // validate text
        if (!newText || newText.trim() === "") {
            return res.status(400).json({ message: "New text is required" });
        }

        // validate message existence
        const message = await Message.findOne({ messageID, isDeleted: { $ne: true }});
        if(!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // ensure only original sender can edit the message
        if(message.sender !== userID) {
            return res.status(403).json({ message: "You can't edit this message" });
        }

        // prevent editing if message is already seen by others
        const seenByOthers = message.seenBy.some(entry => entry.user !== userID);
        if (seenByOthers) {
            return res.status(400).json({ message: "Cannot edit a message that has already been seen" });
        }

        // update message text
        message.text = newText;
        message.isEdited = true;
        await message.save();

        // send real time updates 
        const chat = await Chat.findOne({ chatID: message.chatID }).select("chatID participants").lean();
        const io = getIO();

        chat.participants.forEach((user) => {
            if(user == userID) return;
            
            const socketID = getSocketID(user);
            if(socketID) {
                io.to(socketID).emit("editMessage", {
                    chatID: chat.chatID,
                    messageID: message.messageID,
                    text: message.text,
                });
            }
        });

        return res.status(200).json({ message: "Message edited successfully", updatedMessage: message });

    } catch (error) {
        console.error("Error in edit message controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const deleteMessage = async (req, res) => {
    try {
        const userID = req.user.userID;
        const messageID = parseInt(req.params.messageID);

        // validate message existence
        const message = await Message.findOne({ messageID, isDeleted: { $ne: true }});
        if(!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // ensure only sender can delete the message
        if(message.sender !== userID) {
            return res.status(403).json({ message: "You can't delete this message" });
        }

        // soft delete the message
        message.isDeleted = true;
        message.text = "";
        message.image = "";
        await message.save();

        // send real time updates 
        const chat = await Chat.findOne({ chatID: message.chatID }).select("chatID participants").lean();
        const io = getIO();

        chat.participants.forEach((user) => {
            if(user == userID) return;
            
            const socketID = getSocketID(user);
            if(socketID) {
                io.to(socketID).emit("deleteMessage", {
                    chatID: chat.chatID,
                    messageID: message.messageID,
                });
            }
        });

        res.status(200).json({ message: "Message deleted successfully", deletedMessage: message});

    } catch (error) {
        console.error("Error in delete message controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

module.exports = {
    getChats, getChatMessages, getPrivateChat, getGroupChat, markMessagesAsSeen,
    sendMessage, sendGroupInvites, editMessage, deleteMessage
}