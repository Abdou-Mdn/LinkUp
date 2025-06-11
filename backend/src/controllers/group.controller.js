const Group = require("../models/group.model");
const User = require("../models/user.model");
const Chat = require("../models/chat.model");
const Message = require("../models/message.model");

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

const getGroupDetails = async (req, res) => {
    try {
        const groupID = parseInt(req.params.groupID);

        const group = await Group.findOne({groupID}).select("-_id -__v");

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
        const groupID = parseInt(req.query.groupID);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const group = await Group.findOne({groupID}).select("members");
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
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

const createGroup = async (req, res) => {
    try {
        const creatorID = req.user.userID;
        const { name, members } = req.body

        if(!name) {
            return res.status(400).json({"message": "Group name is required"});
        }

        // check if one member or more are added
        if (!Array.isArray(members) || members.length < 1) {
            return res.status(400).json({ message: "At least one other member is required to create a group" });
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
        const { name, image, description } = req.body;

        const group = await Group.findOne({ groupID });
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // check if the user is an admin of the group
        if (!group.admins.includes(userID)) {
            return res.status(403).json({ message: "Only group admins can update the group" });
        }
        
        if(name) group.name = name;
        if(description != undefined) {
            if (description.length > 150) {
                return res.status(400).json({ message: "Description must be 150 characters or fewer" });
            }
            group.description = description;
        } 
        if(image) {
            // uploading the pic to cloudinary first
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "groups"
            });
            group.image = uploadResponse.secure_url;
        }

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

        const group = await Group.findOne({ groupID });
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
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

module.exports = {
    getGroups, getGroupDetails, getGroupMembers, 
    createGroup, updateGroup, removeGroup
}