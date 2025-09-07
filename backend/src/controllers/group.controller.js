const Group = require("../models/group.model");
const User = require("../models/user.model");
const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const cloudinary = require("../lib/cloudinary")

/* ********* getting details ********* */

const getGroups = async (req, res) => {
    try {
        const name = req.query.name || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // creating filter to get the groups with names that include the provided name 
        const filter = {
            name: { $regex: name, $options: 'i'}, // case insensitive search
        };

        const total = await Group.countDocuments(filter) // getting the total number of groups 

        // getting the groups
        const groups = await Group.find(filter) // applying the filter
            .skip((page - 1) * limit) // getting the requested page
            .limit(limit) // getting only the number requested
            .select("groupID name image members createdAt"); // selecting the necessary fields only

        res.json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalResults: total,
            groups
        });

    } catch (error) {
        console.error("Error in get groups controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const getAdminGroups = async (req, res) => {
    try {
        const userID = req.user.userID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // select only groups where i am admin
        const filter = { admins: userID };

        const total = await Group.countDocuments(filter);

        const groups = await Group.find(filter)
            .skip((page - 1) * limit)
            .limit(limit)
            .select("groupID name image members createdAt");

        res.json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalResults: total,
            groups
        });

    } catch (error) {
        console.error("Error in getAdminGroups controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getMemberGroups = async (req, res) => {
    try {
        const userID = req.user.userID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // select all the groups where i am only a member and not admin
        const filter = {
            "members.user": userID,
            admins: { $ne: userID }
        };

        const total = await Group.countDocuments(filter);

        const groups = await Group.find(filter)
            .skip((page - 1) * limit)
            .limit(limit)
            .select("groupID name image members createdAt");

        res.json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalResults: total,
            groups
        });

    } catch (error) {
        console.error("Error in getMemberGroups controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getGroupDetails = async (req, res) => {
    try {
        const groupID = parseInt(req.params.groupID);

        const group = await Group.findOne({groupID}).select("-_id -__v")
        if(!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        res.json(group);
    } catch (error) {
        console.error("Error in get group details controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getGroupMembers = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const group = await Group.findOne({groupID}).select("members");
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // check if user is member
        const isMember = group.members.some(m => m.user === userID);
        if(!isMember) {
            return res.status(403).json({ message: "Only group members can see the group members" });
        }

        // we sort the members based on the time they joined 
        const sortedMembers = group.members.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));

        const total = sortedMembers.length;
        const startIndex = (page - 1) * limit;
        const paginatedMembers = sortedMembers.slice(startIndex, startIndex + limit);

        // get all the member ids 
        const memberIDs = paginatedMembers.map(m => m.user);

        if (memberIDs.length === 0) {
            // if group has no members we return an empty array 
            return res.json({
                page,
                limit,
                totalPages: 0,
                totalResults: 0,
                members: []
            });
        }

        // we find all the users that are in the group members
        const users = await User.find({userID: { $in: memberIDs }, isDeleted: { $ne: true }})
            .select("userID name profilePic");

        // we map back all the joinedAt values to their users
        const joinedAtMap = new Map();
        paginatedMembers.forEach(mem => {
            joinedAtMap.set(mem.user, mem.joinedAt);
        });

        const members = users.map(u => ({
            ...u.toObject(),
            joinedAt: joinedAtMap.get(u.userID)
        }));
        
        return res.json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalResults: total,
            members
        });

    } catch (error) {
        console.error("Error in get group members controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getFriendMembers = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);   


        // we select the friends array of the user and the members array of the group 
        const user = await User.findOne({userID, isDeleted: { $ne: true }})
            .select("friends");
        const group = await Group.findOne({groupID})
            .select("members");

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if(!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // we get the friend ids of the user and the member ids of the group
        const userFriends = user.friends.map(f => f.user);
        const groupMembers = group.members.map(f => f.user);

        // we look for the intersection between the two arrays
        const mutualIDs = userFriends.filter(id => groupMembers.includes(id));

        // if intersection is empty we return empty array
        if (mutualIDs.length === 0) {
            return res.json({ members: [] });
        }

         // Create a map of userID -> joinedAt from group.members
        const joinedAtMap = new Map();
        group.members.forEach(mem => {
            if (mutualIDs.includes(mem.user)) {
                joinedAtMap.set(mem.user, mem.joinedAt);
            }
        });

        const friendMembers = await User.find({
            userID: { $in: mutualIDs },
            isDeleted: { $ne: true }
        }).select("userID name profilePic");

        // Add joinedAt to each friend member
        const members = friendMembers.map(u => ({
            ...u.toObject(),
            joinedAt: joinedAtMap.get(u.userID)
        }));

        res.json({ members });

    } catch (error) {
        console.error("Error in get friend members controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

/* ********* managing group ********* */

const createGroup = async (req, res) => {
    try {
        const creatorID = req.user.userID;
        const { name, members } = req.body

        if(!name || name.trim() === "") {
            return res.status(400).json({"message": "Group name is required"});
        }

        // check if one member or more are added
        if (!Array.isArray(members) || members.length < 2) {
            return res.status(400).json({ message: "At least two other members are required to create a group" });
        }

        const creator = await User.findOne({userID: creatorID, isDeleted: { $ne: true }});

        if(!creator) {
            return res.status(404).json({ message: "User not found" });
        }

        // remove duplicates and ensure creator is not re-added
        const uniqueMemberIDs = [...new Set(members.filter(id => id !== creatorID))];

        // include creator as a member
        const memberEntries = [
            { user: creatorID, joinedAt: new Date() },
            ...uniqueMemberIDs.map(id => ({ user: id, joinedAt: new Date() }))
        ];

        const newGroup = new Group({
            name,
            members: memberEntries,
            admins: [creatorID]
        });

        const savedGroup = await newGroup.save();
        
        // create a chat for the group
        const chat = new Chat({
            isGroup: true,
            group: savedGroup.groupID,
            participants: [creatorID, ...uniqueMemberIDs],
            updatedAt: new Date()
        });

        const savedChat = await chat.save();

        // send creation announcement message
        const message = new Message({
            chatID: savedChat.chatID,
            sender: creatorID,
            text: "created the group",
            isAnnouncement: true
        });

        const savedMessage = await message.save();

        savedChat.lastMessage = savedMessage.messageID;
        savedChat.updatedAt = new Date();

        await savedChat.save();
        
        res.status(201).json({ group: savedGroup});

    } catch (error) {
        console.error("Error in create group controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const updateGroup = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);
        const { name, image, banner, description } = req.body;

        const admin = await User.findOne({userID: userID, isDeleted: { $ne: true }});
        const group = await Group.findOne({ groupID });
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if(!admin) {
            return res.status(404).json({ message: "User not found" });
        }

        // check if the user is an admin of the group
        if (!group.admins.includes(userID)) {
            return res.status(403).json({ message: "Only group admins can update the group" });
        }

        // track which updates are applied 
        let updates = [];
        
        if(name && name != group.name) {
            group.name = name;
            updates.push("name");
        } 
        if(description != undefined && description != group.description) {
            if (description.length > 150) {
                return res.status(400).json({ message: "Description must be 150 characters or fewer" });
            }
            group.description = description;
            updates.push("description");
        } 
        if(image) {
            // uploading the pic to cloudinary first
            console.log("uploading group image");
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "groups"
            });
            console.log("group image uploaded");
            group.image = uploadResponse.secure_url;
            updates.push("image")
        }
        if(banner) {
            // uploading the banner to cloudinary first
            console.log("uploading group banner");
            const uploadResponse = await cloudinary.uploader.upload(banner, {
                folder: "groups"
            });
            console.log("group banner uploaded")
            group.banner = uploadResponse.secure_url;
            updates.push("banner");
        }

        if(updates.length == 0) {
            return res.status(400).json({ message: "No valid changes provided." });
        }

        // find corresponding chat
        const chat = await Chat.findOne({ group: groupID });
        if (!chat) return res.status(500).json({ message: "Associated chat not found" });

        // send announcement message
        let announcement = "";
        if(updates.length == 1) {
            announcement = `updated the group's ${updates[0]}`
        } else {
            announcement = `updated the group's details`
        }

        const message = new Message({
            chatID: chat.chatID,
            sender: userID,
            text: announcement,
            isAnnouncement: true
        });

        const savedMessage = await message.save();

        chat.lastMessage = savedMessage.messageID;
        chat.updatedAt = new Date();
        await chat.save();

        // send response
        const updatedGroup = await group.save();
        res.json({ message: "Group is updated successfully", group: updatedGroup });

    } catch (error) {
        console.error("Error in update group controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const removeGroup = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);

        const admin = await User.findOne({userID: userID, isDeleted: { $ne: true }});
        const group = await Group.findOne({ groupID });

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if(!admin) {
            return res.status(404).json({ message: "User not found" });
        }

        // check if the user is an admin of the group
        if (!group.admins.includes(userID)) {
            return res.status(403).json({ message: "Only group admins can delete the group" });
        }

        // delete the group
        await Group.deleteOne({ groupID });

        // find and delete the chat associated with this group
        const chat = await Chat.findOneAndDelete({ group: groupID });

        // delete all messages referencing the deleted chat
        if (chat) {
            await Message.deleteMany({ chat: chat.chatID });
        }

        res.status(200).json({ message: "Group deleted successfully"});
    } catch (error) {
        console.error("Error in remove group controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

/* ********* managing members ********* */

const addMembers = async (req, res) => {
    try {
        const adminID = req.user.userID;
        const groupID = parseInt(req.params.groupID);
        const userIDs = req.body.users;

        if (!Array.isArray(userIDs) || userIDs.length === 0) {
            return res.status(400).json({ message: "No users selected" });
        }

        const admin = await User.findOne({userID: adminID, isDeleted: { $ne: true }});
        const group = await Group.findOne({groupID});
        const chat = await Chat.findOne({ group: groupID });

        // check if group exists
        if(!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // check if the added user exists
        if(!admin) {
            return res.status(404).json({ message: "User not found" });
        }

        //check if group chat exists
        if (!chat) return res.status(500).json({ message: "Associated chat not found" });

        // check if the user is admin
        if(!group.admins.includes(adminID)) {
            return res.status(403).json({ message: "Only admin can add members" });
        }

        let addedUsers = [];

        for(const memberID of userIDs) {
            const member = await User.findOne({ userID: memberID, isDeleted: { $ne: true } });

            if(!member) continue;

            // check if added user is already a member
            const isAlreadyMember = group.members.some(m => m.user === memberID);
            if (isAlreadyMember) continue;

            const date = new Date();

            group.members.push({
                user: memberID,
                joinedAt: date
            });

            await Chat.updateOne(
                { chatID: chat.chatID },
                { $addToSet: { participants: memberID } }
            );

            addedUsers.push({...member.toObject(), joinedAt: date})
        }

        if (addedUsers.length > 0) {
            await group.save();
            const added = addedUsers[0].name;
            let announcement = `added ${added}`;
            if (addedUsers.length > 1) {
                announcement += ` and ${addedUsers.length - 1} other${addedUsers.length > 2 ? 's' : ''}`;
            }
            announcement += " to the group"

            const message = new Message({
                chatID: chat.chatID,
                sender: adminID,
                text: announcement,
                isAnnouncement: true
            });

            const savedMessage = await message.save();

            chat.lastMessage = savedMessage.messageID;
            chat.updatedAt = new Date();
            await chat.save();

            res.status(200).json({ 
                message: `${addedUsers.length} member${addedUsers.length == 1 ? '' : 's'} added successfully`,
                group,
                addedUsers
            });
        } else {
            res.status(400).json({ message: "Failed to add any members to the group" });
        }       

    } catch (error) {
        console.error("Error in add member controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const removeMember = async (req, res) => {
    try {
        const adminID = req.user.userID;
        const memberID = parseInt(req.params.userID);
        const groupID = parseInt(req.params.groupID);

        const admin = await User.findOne({userID: adminID, isDeleted: { $ne: true }});
        const group = await Group.findOne({groupID});
        const member = await User.findOne({userID: memberID, isDeleted: { $ne: true }});

        // check if group exists
        if(!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // check if the removed user exists
        if(!member || !admin) {
            return res.status(404).json({ message: "User not found" });
        }

        // check if the user is admin
        if(!group.admins.includes(adminID)) {
            return res.status(403).json({ message: "Only admin can remove members" });
        }

        // check if removed user is already a member
        const isAlreadyMember = group.members.some(m => m.user === memberID);
        if (!isAlreadyMember) {
            return res.status(400).json({ message: "User is not a member of the group" });
        }

        // remove the user from the members
        group.members = group.members.filter(m => m.user !== memberID);

        // remove the user from the admins if he's an admin
        group.admins = group.admins.filter(a => a !== memberID);

        await group.save();

        const chat = await Chat.findOneAndUpdate(
            { group: groupID },
            { $pull: { participants: memberID } }
        );

        if (!chat) return res.status(500).json({ message: "Associated chat not found" });

        const message = new Message({
            chatID: chat.chatID,
            sender: adminID,
            text: `removed ${member.name} from the group`,
            isAnnouncement: true
        });

        const savedMessage = await message.save();

        chat.lastMessage = savedMessage.messageID;
        chat.updatedAt = new Date();
        await chat.save();

        res.status(200).json({ message: "Member removed successfully", group});        

    } catch (error) {
        console.error("Error in remove member controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}


const addAdmin = async (req, res) => {
    try {
        const adminID = req.user.userID;
        const newAdminID = parseInt(req.params.userID);
        const groupID = parseInt(req.params.groupID);

        const admin = await User.findOne({userID: adminID, isDeleted: { $ne: true }});
        const group = await Group.findOne({groupID});
        const newAdmin = await User.findOne({userID: newAdminID, isDeleted: { $ne: true }});

        // check if group exists
        if(!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // check if the added user exists
        if(!newAdmin || !admin) {
            return res.status(404).json({ message: "User not found" });
        }

        // check if the user is admin
        if(!group.admins.includes(adminID)) {
            return res.status(403).json({ message: "Only admin can add members" });
        }

        // check if added user is already a member
        const isAlreadyMember = group.members.some(m => m.user === newAdminID);
        if (!isAlreadyMember) {
            return res.status(400).json({ message: "User must be a member of the group" });
        }

        // check if added user is already an admin
        if (group.admins.includes(newAdminID)) {
            return res.status(400).json({ message: "User is already an admin of the group" });
        }

        group.admins.push(newAdminID);

        await group.save();

        const chat = await Chat.findOne({ group: groupID });

        if (!chat) return res.status(500).json({ message: "Associated chat not found" });

        const message = new Message({
            chatID: chat.chatID,
            sender: adminID,
            text: `promoted ${newAdmin.name} to admin`,
            isAnnouncement: true
        });

        const savedMessage = await message.save();

        chat.lastMessage = savedMessage.messageID;
        chat.updatedAt = new Date();
        await chat.save();

        res.status(200).json({ message: `${newAdmin.name} has been promoted to admin.`, group});        

    } catch (error) {
        console.error("Error in add admin controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const removeAdmin = async (req, res) => {
    try {
        const adminID = req.user.userID;
        const targetUserID = parseInt(req.params.userID);
        const groupID = parseInt(req.params.groupID);

        const admin = await User.findOne({ userID: adminID, isDeleted: { $ne: true } });
        const targetUser = await User.findOne({ userID: targetUserID, isDeleted: { $ne: true } });
        const group = await Group.findOne({ groupID });

        if (!admin || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if requester is admin
        if (!group.admins.includes(adminID)) {
            return res.status(403).json({ message: "Only admin can remove other admins" });
        }

        // Check if target is an admin
        if (!group.admins.includes(targetUserID)) {
            return res.status(400).json({ message: "User is not an admin" });
        }

        // Prevent removing the last admin
        if (group.admins.length === 1 && group.admins[0] === targetUserID) {
            return res.status(400).json({ message: "Cannot remove the only remaining admin" });
        }

        // Remove from admins
        group.admins = group.admins.filter(a => a !== targetUserID);
        await group.save();

        const chat = await Chat.findOne({ group: groupID });

        if (!chat) return res.status(500).json({ message: "Associated chat not found" });

        const message = new Message({
            chatID: chat.chatID,
            sender: adminID,
            text: `removed ${targetUser.name} from admin role`,
            isAnnouncement: true
        });

        const savedMessage = await message.save();

        chat.lastMessage = savedMessage.messageID;
        chat.updatedAt = new Date();
        await chat.save();

        res.status(200).json({ message: `${targetUser.name} is no longer an admin.`, group });

    } catch (error) {
        console.error("Error in removeAdmin controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const leaveGroup = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);   

        const user = await User.findOne({userID, isDeleted: { $ne: true }});
        const group = await Group.findOne({groupID})

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = group.members.some(m => m.user === userID);
        if (!isMember) {
            return res.status(400).json({ message: "You are not a member of this group" });
        }

        // remove user from the members array 
        group.members = group.members.filter(m => m.user !== userID);

        // check if user is admin and remove him from the admins array
        if(group.admins.includes(userID)) {
            group.admins = group.admins.filter(a => a !== userID);
        }

        // check if all members left then remove the whole groupe
        if(group.members.length == 0) {
            // delete the group
            await Group.deleteOne({ groupID });

            // find and delete the chat associated with this group
            const chat = await Chat.findOneAndDelete({ group: groupID });

            // delete all messages referencing the deleted chat
            if (chat) {
                await Message.deleteMany({ chat: chat.chatID });
            }

            return res.status(200).json({ message: "You left the group", group: null });
        }

        // check if all admins left the group then assign another member as the new admin
        let newAdmin = null;
        if(group.admins.length == 0) {
            newAdmin = group.members[0].user;
            group.admins.push(newAdmin);
        }

        await group.save();

        const chat = await Chat.findOneAndUpdate(
            { group: groupID },
            { $pull: { participants: userID } }
        );

        if (!chat) return res.status(500).json({ message: "Associated chat not found" });

        const message = new Message({
            chatID: chat.chatID,
            sender: userID,
            text: `left the group`,
            isAnnouncement: true
        });

        const savedMessage = await message.save();

        chat.lastMessage = savedMessage.messageID;
        chat.updatedAt = new Date();
        await chat.save();

        if(newAdmin) {

            const adminMessage = new Message({
                chatID: chat.chatID,
                sender: newAdmin,
                text: `is now the new admin`,
                isAnnouncement: true
            });

            const savedAdminMessage = await adminMessage.save();

            chat.lastMessage = savedAdminMessage.messageID;
            chat.updatedAt = new Date();
            await chat.save();

        }

        res.status(200).json({ message: "You left the group", group });
    } catch (error) {
        console.error("Error in leave group controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

/* ********* managing requests ********* */

const getPendingJoinRequests = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID); 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;  

        const user = await User.findOne({userID, isDeleted: { $ne: true }});
        const group = await Group.findOne({groupID}).select("admins joinRequests");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

         // check if the user is admin
        if(!group.admins.includes(userID)) {
            return res.status(403).json({ message: "Only admin can see pending requests" });
        }

        // we sort the requesters based on the time they requested 
        const sortedRequesters = group.joinRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

        const total = sortedRequesters.length;
        const startIndex = (page - 1) * limit;
        const paginatedRequesters = sortedRequesters.slice(startIndex, startIndex + limit);

        // get all the requester ids 
        const requesterIDs = paginatedRequesters.map(m => m.user);

        if (requesterIDs.length === 0) {
            // if group has no requests we return an empty array 
            return res.json({
                page,
                limit,
                totalPages: 0,
                totalResults: 0,
                requests: []
            });
        }

        // we find all the users that are in the join requests
        const users = await User.find({userID: { $in: requesterIDs }, isDeleted: { $ne: true }})
            .select("userID name profilePic");

        // we map back all the requestedAt values to their users
        const requestedAtMap = new Map();
        paginatedRequesters.forEach(mem => {
            requestedAtMap.set(mem.user, mem.requestedAt);
        });

        const requesters = users.map(u => ({
            ...u.toObject(),
            requestedAt: requestedAtMap.get(u.userID)
        }));
        
        return res.json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalResults: total,
            requests: requesters
        });

    } catch (error) {
        console.error("Error in get pending join requests controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
} 

const sendJoinRequest = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);   

        const user = await User.findOne({userID, isDeleted: { $ne: true }});
        const group = await Group.findOne({groupID})

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isAlreadyMember = group.members.some(m => m.user === userID);
        if (isAlreadyMember) {
            return res.status(400).json({ message: "You are already a member of this group" });
        }

        // check if request is already sent
        const alreadyRequested = group.joinRequests.some(r => r.user === userID) && user.sentJoinRequests.some(r => r.group === groupID);
        if (alreadyRequested) {
            return res.status(400).json({ message: "Join request already sent." });
        }

        const date = new Date();

        // add request to the group
        group.joinRequests.push({
            user: userID,
            requestedAt: date
        });


        // add request to the user
        user.sentJoinRequests.push({
            group: groupID,
            requestedAt: date
        }) 

        await group.save();
        await user.save();

        res.status(200).json({ 
            message: "Join request sent successfully.", 
            group, 
            user, 
            request : { ...group, requestedAt: date}
        });
    } catch (error) {
        console.error("Error in send join request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const cancelJoinRequest = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);

        const user = await User.findOne({userID, isDeleted: { $ne: true }});
        const group = await Group.findOne({groupID});

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }


        // check if request exists
        const requested = group.joinRequests.some(r => r.user === userID) && user.sentJoinRequests.some(r => r.group === groupID);
        if (!requested) {
            return res.status(400).json({ message: "No pending request to cancel." });
        }

        // remove from user's sent requests
        user.sentJoinRequests = user.sentJoinRequests.filter(r => r.group !== groupID);

        // remove from group's join requests
        group.joinRequests = group.joinRequests.filter(r => r.user !== userID);
        
        await group.save();
        await user.save();

        res.status(200).json({ message: "Join request canceled successfully", group, user });
    } catch (error) {
        console.error("Error in cancel join request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const acceptJoinRequest = async (req, res) => {
    try {
        const adminID = req.user.userID;
        const requesterID = parseInt(req.params.userID);
        const groupID = parseInt(req.params.groupID);

        const admin = await User.findOne({userID: adminID, isDeleted: { $ne: true }});
        const requester = await User.findOne({userID: requesterID, isDeleted: { $ne: true }});
        const group = await Group.findOne({groupID});

        if (!admin || !requester) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // check if the user is admin
        if(!group.admins.includes(adminID)) {
            return res.status(403).json({ message: "Only admin can accept join requests" });
        }

        // check if request is exists
        const requested = group.joinRequests.some(r => r.user === requesterID) && requester.sentJoinRequests.some(r => r.group === groupID);
        if (!requested) {
            return res.status(400).json({ message: "No pending request to accept." });
        }

        // add user to group members
        const date = new Date();
        group.members.push({ user: requesterID, joinedAt: date });

        const addedUser = {...requester.toObject(), joinedAt: date}

        // remove from user's sent requests
        requester.sentJoinRequests = requester.sentJoinRequests.filter(r => r.group !== groupID);

        // remove from group's join requests
        group.joinRequests = group.joinRequests.filter(r => r.user !== requesterID);

        await group.save();
        await requester.save();

        const chat = await Chat.findOneAndUpdate(
            { group: groupID },
            { $addToSet: { participants: requesterID } }
        );

        if (!chat) return res.status(500).json({ message: "Associated chat not found" });

        const message = new Message({
            chatID: chat.chatID,
            sender: requesterID,
            text: `joined the group`,
            isAnnouncement: true
        });

        const savedMessage = await message.save();

        chat.lastMessage = savedMessage.messageID;
        chat.updatedAt = new Date();
        await chat.save();

        res.status(200).json({ message: "Join request accepted", group, addedUser });

    } catch (error) {
        console.error("Error in accept join request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const declineJoinRequest = async (req, res) => {
    try {
        const adminID = req.user.userID;
        const requesterID = parseInt(req.params.userID);
        const groupID = parseInt(req.params.groupID);

        const admin = await User.findOne({userID: adminID, isDeleted: { $ne: true }});
        const requester = await User.findOne({userID: requesterID, isDeleted: { $ne: true }});
        const group = await Group.findOne({groupID});

        if (!admin || !requester) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // check if the user is admin
        if(!group.admins.includes(adminID)) {
            return res.status(403).json({ message: "Only admin can decline join requests" });
        }

        // check if request exists
        const requested = group.joinRequests.some(r => r.user === requesterID) && requester.sentJoinRequests.some(r => r.group === groupID);
        if (!requested) {
            return res.status(400).json({ message: "No pending request to decline." });
        }

        // remove from user's sent requests
        requester.sentJoinRequests = requester.sentJoinRequests.filter(r => r.group !== groupID);

        // remove from group's join requests
        group.joinRequests = group.joinRequests.filter(r => r.user !== requesterID);

        await group.save();
        await requester.save();

        res.status(200).json({ message: "Join request declined", group });

    } catch (error) {
        console.error("Error in decline join request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getGroups, getGroupDetails, getAdminGroups, getMemberGroups, getGroupMembers, getFriendMembers,
    createGroup, updateGroup, removeGroup,
    addMembers, removeMember, addAdmin, removeAdmin, leaveGroup,
    getPendingJoinRequests, sendJoinRequest, cancelJoinRequest, acceptJoinRequest, declineJoinRequest
}