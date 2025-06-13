const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const Group = require("../models/group.model");
const User = require("../models/user.model");

/* ********** getting chat details ********** */

const getChats = async (req, res) => {
    try {
        const userID = req.user.userID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        // count the total number of the chats where the user is a participant
        const total = await Chat.countDocuments({participants: userID}); 

        // getting all the chats sorted chronologically
        const chats = await Chat.find({ participants: userID })
            .sort({ updatedAt: -1 }) // sort from newest to oldest
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: "lastMessage",
                select: "-_id -__v -chatID"
            })
            .populate({
                path: "participants",
                select: "userID name profilePic lastSeen isDeleted"
            })
            .populate({
                path: "group",
                select: "groupID name image"
            });

        res.json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalResults: total,
            chats
        });
        
    } catch (error) {
        console.error("Error in get chats controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const getChatMessages = async (req, res) => {
    try {
        const userID = req.user.userID;
        const chatID = parseInt(req.query.chatID);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        const chat = await Chat.findOne({chatID}).select("participants");

        if(!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        if(!chat.participants.includes(userID)) {
            return res.status(403).json({ message: "You are not a participant of this chat" });
        }

        // count total messages
        const total = await Message.countDocuments({ chatID });

        // Get messages (oldest to newest)
        const messages = await Message.find({ chatID })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
            path: "sender",
            select: "userID name profilePic",
        })
        .populate({
            path: "replyTo",
            select: "messageID text image isGroupInvite sender",
            populate: {
            path: "sender",
            select: "userID name",
            },
        })
        .select("-__v -_id");

        res.json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalResults: total,
            messages
        });

    } catch (error) {
        console.error("Error in get chat messages controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const getPrivateChat = async (req, res) => {
    try {
        const userID = req.user.userID;
        const otherUserID = parseInt(req.query.userID);

        if (userID === otherUserID) {
            return res.status(400).json({ message: "Cannot chat with yourself" });
        }

        const chat = await Chat.findOne({
            isGroup: false,
            participants: { $all: [userID, otherUserID] },
        }).select("chatID");

        res.json({ chatID: chat ? chat.chatID : null });
    } catch (error) {
        console.error("Error in get private chat controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const getGroupChat = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.query.groupID);

        const group = await Group.findOne({ groupID });
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = group.members.some(m => m.user === userID);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const chat = await Chat.findOne({ isGroup: true, group: groupID }).select("chatID");

        res.json({ chatID: chat ? chat.chatID : null });
    } catch (error) {
        console.error("Error in get private chat controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const markMessagesAsSeen = async (req, res) => {
    try {
        const userID = req.user.userID;
        const chatID = parseInt(req.query.chatID);

        const chat = await Chat.findOne({ chatID });

        if(!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        if(!chat.participants.includes(userID)) {
            return res.status(403).json({ message: "You are not a participant of this chat" });
        }

        // find the messages that have not yet been seen by this user
        const unseenMessages = await Message.find({
            chatID,
            "seenBy.user": { $ne: userID }
        });

        if (unseenMessages.length === 0) {
            return res.status(200).json({ message: "No unseen messages", updatedMessages: [] });
        }

        const updatedMessages = [];

        for(const msg of unseenMessages) {
            msg.seenBy.push({ user: userID, seenAt: new Date() });
            await msg.save();
            updatedMessages.push(msg);
        }

        return res.status(200).json({ message: "all messages marked as seen", updatedMessages });

    } catch (error) {
        console.error("Error in mark message as seen controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

/* ********** managing messages ********** */

const sendMessage = async (req, res) => {
    try {
        const senderID = req.user.userID;
        const {chatID, receiverID, text, image, replyTo, groupInvite} = req.body


        if(!text && !image) {
            return res.status(400).json({ message: "Cannot send empty message" });
        }

        let chat;

        // if chatID is provided
        if(chatID) {
            // find the chat 
            chat = await Chat.findOne({ chatID });

            if(!chat) {
                return res.status(404).json({ message: "Chat not found" });
            }

            // check if the sender is part of the chat 
            if (!chat.participants.includes(senderID)) {
                return res.status(403).json({ message: "You're not part of this chat" });
            }
        } else if(receiverID) {
            // check if a chat already exists            
            const existingChat = await Chat.findOne({
                isGroup: false,
                participants: { $all: [senderID, receiverID] }
            });

            if(existingChat) {
                chat = existingChat;
            } else {
                // create a new chat
                chat = new Chat({
                    isGroup: false,
                    participants: [senderID, receiverID],
                    updatedAt: new Date()
                });
                await chat.save();
            }
        } else {
            return res.status(400).json({ message: "chatID or receiverID must be provided" });
        }

        if(replyTo) {
            // check if the message we're replying to exists
            const refMessage = await Message.findOne({ messageID: replyTo});
            if(!refMessage) {
                return res.status(400).json({ message: "Cannot reply to non existing message" });
            }

            // check if the message we're replying belongs to the same chat
            if (refMessage.chatID !== chat.chatID) {
                return res.status(400).json({ message: "Cannot reply to a message from a different chat" });
            }
        }

        if (groupInvite) {
            const group = await Group.findOne({ groupID: groupInvite });
            if (!group) {
                return res.status(400).json({ message: "Group invite is invalid" });
            }
        }

        let imageUrl;
        if(image) {
            // uploading the pic to cloudinary first
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "messages"
            });
            imageUrl = uploadResponse.secure_url;
        }


        const message = new Message({
            chatID: chat.chatID,
            sender: senderID,
            text,
            image: imageUrl,
            replyTo,
            groupInvite,
            seenBy: [senderID]
        });

        await message.save();

        chat.lastMessage = message.messageID;
        chat.updatedAt = new Date();

        await chat.save();

        res.status(201).json({ message: "Message sent", message });

    } catch (error) {
        console.error("Error in send message controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const editMessage = async (req, res) => {
    try {
        const userID = req.user.userID;
        const messageID = parseInt(req.query.messageID);
        const { newText } = req.body

        if (!newText || newText.trim() === "") {
            return res.status(400).json({ message: "New text is required" });
        }

        const message = await Message.findOne({ messageID, isDeleted: { $ne: true }});

        if(!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // check if the editor is the sender of the message
        if(message.sender !== userID) {
            return res.status(403).json({ message: "You can't edit this message" });
        }

        // check if the message has been seen by anyone other than the sender
        const seenByOthers = message.seenBy.some(entry => entry.user !== userID);
        if (seenByOthers) {
            return res.status(400).json({ message: "Cannot edit a message that has already been seen" });
        }

        message.text = newText;
        message.isEdited = true;
        await message.save();

        return res.status(200).json({ message: "Message edited successfully", updatedMessage: message });

    } catch (error) {
        console.error("Error in edit message controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const deleteMessage = async (req, res) => {
    try {
        const userID = req.user.userID;
        const messageID = parseInt(req.query.messageID);

        const message = await Message.findOne({ messageID, isDeleted: { $ne: true }});

        if(!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // check if the user is the sender of the message
        if(message.sender !== userID) {
            return res.status(403).json({ message: "You can't delete this message" });
        }

        message.isDeleted = true;
        message.text = "";
        message.image = "";

        await message.save();

        res.status(200).json({ message: "Message deleted successfully", deletedMessage: message});

    } catch (error) {
        console.error("Error in delete message controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

module.exports = {
    getChats, getChatMessages, getPrivateChat, getGroupChat, markMessagesAsSeen,
    sendMessage, editMessage, deleteMessage
}