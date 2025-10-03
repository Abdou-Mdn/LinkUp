const mongoose = require("mongoose");
const Group = require("../models/group.model");
const User = require("../models/user.model");
const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const cloudinary = require("../lib/cloudinary");
const { relevanceSearchPipeline, createAnnouncementMessage } = require("../lib/queries");

/* ********* getting details ********* */

// fetch groups based on provided name
const getGroups = async (req, res) => {
    try {
        const name = req.query.name || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // search filter (case-insensitive partial match on group name) 
        const filter = {
            name: { $regex: name, $options: 'i'}, 
        };

        const projection = {
            groupID: 1,
            name: 1,
            image: 1,
            members: 1,
            createdAt: 1
        }

        // parallel queries for optimization
        const [total, groups] = await Promise.all([
            // count total number of groups that match the filter
            Group.countDocuments(filter),

            Group.aggregate([
                { $match: filter },
                ...relevanceSearchPipeline(name, projection),
                { $skip: (page - 1) * limit },
                { $limit: limit }
            ]),
        ]);

        // return paginated response
        res.json({
            totalPages: Math.ceil(total / limit),
            groups
        });

    } catch (error) {
        console.error("Error in get groups controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

// fetch only groups which the user is admin of
const getAdminGroups = async (req, res) => {
    try {
        const userID = req.user.userID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // select groups where user is admin
        const filter = { admins: userID };

        const [total, groups] = await Promise.all([
            // count total documents
            Group.countDocuments(filter),

            // fetch groups
            Group.find(filter)
                .skip((page - 1) * limit)
                .limit(limit)
                .select("groupID name image members createdAt")
                .lean()
        ]);
        
        res.json({
            totalPages: Math.ceil(total / limit),
            groups
        });

    } catch (error) {
        console.error("Error in getAdminGroups controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// fetch groups which the user is only member of 
const getMemberGroups = async (req, res) => {
    try {
        const userID = req.user.userID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // select only groups where the user is member and not admin
        const filter = {
            "members.user": userID,
            admins: { $ne: userID }
        };

        const [total, groups] = await Promise.all([
            // count total documents
            Group.countDocuments(filter),

            // fetch groups
            Group.find(filter)
                .skip((page - 1) * limit)
                .limit(limit)
                .select("groupID name image members createdAt")
                .lean()
        ]);

        // return paginated response
        res.json({
            totalPages: Math.ceil(total / limit),
            groups
        });

    } catch (error) {
        console.error("Error in getMemberGroups controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// fetch details of a specefic group
const getGroupDetails = async (req, res) => {
    try {
        const groupID = parseInt(req.params.groupID);

        const group = await Group.findOne({groupID}).select("-_id -__v").lean();
        if(!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }

        res.json(group);
    } catch (error) {
        console.error("Error in get group details controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get list of friends that are members of specefic group
const getFriendMembers = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);   

        // get data from db 
        const [user, group] = await Promise.all([
            User.findOne({userID, isDeleted: { $ne: true }}).select("friends").lean(),
            Group.findOne({groupID}).select("members").lean()
        ])
        
        // validate user existence
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // validate group existence
        if(!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // get friend and member IDs
        const userFriends = user.friends.map(f => f.user);
        const groupMembers = group.members.map(f => f.user);

        // find intersection between friends and members
        const mutualIDs = userFriends.filter(id => groupMembers.includes(id));

        // return empty response if intersection is empty
        if (mutualIDs.length === 0) {
            return res.json({ members: [] });
        }

        // fetch user infos for friend members
        const friendMembers = await User.find({userID: { $in: mutualIDs }, isDeleted: { $ne: true }})
            .select("userID name profilePic")
            .lean();


        // map back joinedAt to member infos
        const joinedAtMap = new Map();
        group.members.forEach(mem => {
            if (mutualIDs.includes(mem.user)) {
                joinedAtMap.set(mem.user, mem.joinedAt);
            }
        });

        const members = friendMembers.map(u => ({
            ...u,
            joinedAt: joinedAtMap.get(u.userID)
        }));

        res.json({ members });

    } catch (error) {
        console.error("Error in get friend members controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get list of members of a specefic group (paginated)
const getGroupMembers = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // validate group existence
        const group = await Group.findOne({groupID}).select("members").lean();
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // validate user membership (only members can see the members list)
        const isMember = group.members.some(m => m.user === userID);
        if(!isMember) {
            return res.status(403).json({ message: "Only group members can see the group members" });
        }

        // extract member IDs
        const memberIDs = group.members.map(m => m.user);

          // if group has no members we return an empty array 
        if (memberIDs.length === 0) {
            return res.json({
                totalPages: 0,
                members: []
            });
        }

        // Build the filter for the members list
        const filter = {
            userID: { $in: memberIDs },
            isDeleted: { $ne: true }
        };

        const [total, users] = await Promise.all([
            User.countDocuments(filter),

            User.find(filter)
            .sort({ name: 1 }) // sorting the results alphabetically 
            .skip((page - 1) * limit)
            .limit(limit)
            .select("userID name profilePic")
            .lean()
        ]);

        // map back joinedAt values to their users
        const joinedAtMap = new Map();
        group.members.forEach(mem => {
            joinedAtMap.set(mem.user, mem.joinedAt);
        });

        const members = users.map(u => ({
            ...u,
            joinedAt: joinedAtMap.get(u.userID)
        }));
        
        // return paginated response
        return res.json({
            totalPages: Math.ceil(total / limit),
            members
        });

    } catch (error) {
        console.error("Error in get group members controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get list of join requests received by a specefic group (paginated) 
const getPendingJoinRequests = async (req, res) => {
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID); 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;  

        // validate user existence
        const user = await User.findOne({userID, isDeleted: { $ne: true }}).select("userID").lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // validate group existence
        const group = await Group.findOne({groupID}).select("admins joinRequests").lean();
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

         // check if user is admin (only admin can see requests)
        if(!group.admins.includes(userID)) {
            return res.status(403).json({ message: "Only admin can see pending requests" });
        }

        // sort requesters based on requested date (newest to oldest) 
        const sortedRequesters = group.joinRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

        // apply manual pagination
        const total = sortedRequesters.length;
        const startIndex = (page - 1) * limit;
        const paginatedRequesters = sortedRequesters.slice(startIndex, startIndex + limit);

        // return empty response if list is empty
        if (paginatedRequesters.length === 0) {
            return res.json({
                totalPages: 0,
                requests: []
            });
        }

        // get all the requester IDs 
        const requesterIDs = paginatedRequesters.map(m => m.user);

        // fetch user details for requesters
        const users = await User.find({userID: { $in: requesterIDs }, isDeleted: { $ne: true }})
            .select("userID name profilePic")
            .lean();


        // map back requestedAt values to requesters
        const requestedAtMap = new Map();
        paginatedRequesters.forEach(mem => {
            requestedAtMap.set(mem.user, mem.requestedAt);
        });

        const requesters = users.map(u => ({
            ...u,
            requestedAt: requestedAtMap.get(u.userID)
        }));
        
        // return paginated response
        return res.json({
            totalPages: Math.ceil(total / limit),
            requests: requesters
        });

    } catch (error) {
        console.error("Error in get pending join requests controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
} 

/* ********* managing group ********* */

// create a new group
const createGroup = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const creatorID = req.user.userID;
        const { name, members } = req.body

        // validate group name
        if(!name || name.trim() === "") {
            await session.abortTransaction();
            return res.status(400).json({"message": "Group name is required"});
        }

        // validate added members (at least 2 added members beside creator)
        if (!Array.isArray(members) || members.length < 2) {
            await session.abortTransaction();
            return res.status(400).json({ message: "At least two other members are required to create a group" });
        }

        // validate creator existence
        const creator = await User.findOne({userID: creatorID, isDeleted: { $ne: true }}).session(session).select("userID").lean();
        if(!creator) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // remove duplicates and ensure creator is not re-added
        const uniqueMemberIDs = [...new Set(members.filter(id => id !== creatorID))];

        // prepare members array (creator first then others)
        const memberEntries = [
            { user: creatorID, joinedAt: new Date() },
            ...uniqueMemberIDs.map(id => ({ user: id, joinedAt: new Date() }))
        ];

        // create and save group
        const newGroup = new Group({
            name,
            members: memberEntries,
            admins: [creatorID]
        });
        const savedGroup = await newGroup.save({session});
        
        // create and save group chat for the new group
        const chat = new Chat({
            isGroup: true,
            group: savedGroup.groupID,
            participants: [creatorID, ...uniqueMemberIDs],
            updatedAt: new Date()
        });
        const savedChat = await chat.save({session});

        // create and save system announcement message
        await createAnnouncementMessage({
            chatID: savedChat.chatID,
            sender: creatorID,
            text: "created the group",
            session
        });

        await session.commitTransaction();

        res.status(201).json({ message: "Group created successfully", group: savedGroup});

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in create group controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

// edit group infos 
const updateGroup = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);
        const { name, image, banner, description } = req.body;

        // get data from db
        const [admin, group, chat] = await Promise.all([
            User.findOne({userID: userID, isDeleted: { $ne: true }}).session(session).select("userID").lean(),
            Group.findOne({ groupID }).session(session),
            Chat.findOne({ group: groupID }).session(session).select("chatID").lean()
        ]);

        // validate admin existence
        if(!admin) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // validate group existence
        if (!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }

        // validate associated chat existence
        if (!chat) {
            await session.abortTransaction();
            return res.status(500).json({ message: "Associated chat not found" });
        } 

        // ensure only admin can edit group infos
        if (!group.admins.includes(userID)) {
            await session.abortTransaction();
            return res.status(403).json({ message: "Only group admins can update the group" });
        }

        // track which updates are applied 
        let updates = [];
        
        // handle update name
        if(name && name != group.name) {
            group.name = name;
            updates.push("name");
        } 

        // handle update description
        if(description != undefined && description != group.description) {
            if (description.length > 150) {
                await session.abortTransaction();
                return res.status(400).json({ message: "Description must be 150 characters or fewer" });
            }
            group.description = description;
            updates.push("description");
        } 

        // handle update image
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

        // handle update banner
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

        // exit if no updates applied 
        if(updates.length == 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "No valid changes provided." });
        }

        // save changes to db
        const updatedGroup = await group.save({session});

        // create announcement text
        let announcement = "";
        if(updates.length == 1) {
            announcement = `updated the group's ${updates[0]}`
        } else {
            announcement = `updated the group's details`
        }

        // create and save system announcement message
        await createAnnouncementMessage({
            chatID: chat.chatID,
            sender: userID,
            text: announcement,
            session
        });

        await session.commitTransaction();

        // send response
        res.json({ message: "Group is updated successfully", group: updatedGroup });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in update group controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

// delete a specefic group
const removeGroup = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);

        // get data from db
        const [admin, group] = await Promise.all([
            User.findOne({userID: userID, isDeleted: { $ne: true }}).session(session).select("userID").lean(),
            Group.findOne({ groupID }).session(session).select("groupID admins").lean()
        ]);

        // validate admin existence
        if(!admin) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // validate group existence
        if (!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }

        // ensure only admin can delete group
        if (!group.admins.includes(userID)) {
            await session.abortTransaction();
            return res.status(403).json({ message: "Only group admins can delete the group" });
        }

        // delete the group
        await Group.deleteOne({ groupID }, { session });

        // find and delete the chat associated with this group
        const chat = await Chat.findOneAndDelete({ group: groupID })
            .session(session)
            .select("chatID")
            .lean();

        // delete all messages referencing the deleted chat
        if (chat) {
            await Message.deleteMany({ chat: chat.chatID }, { session });
        }

        await session.commitTransaction();
        
        res.status(200).json({ message: "Group deleted successfully"});
    } catch (error) {
        await session.abortTransaction();
        console.error("Error in remove group controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

/* ********* managing members ********* */

// add a list of members to a specefic group
const addMembers = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const adminID = req.user.userID;
        const groupID = parseInt(req.params.groupID);
        const userIDs = req.body.users;

        // validate list of added users
        if (!Array.isArray(userIDs) || userIDs.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "No users selected" });
        }

        // get data from db
        const [admin, group, chat] = await Promise.all([
            User.findOne({userID: adminID, isDeleted: { $ne: true }}).session(session).select("userID").lean(),
            Group.findOne({groupID}).session(session).select("groupID members").lean(),
            Chat.findOne({ group: groupID }).session(session).select("chatID").lean()
        ]);

        // validate admin existence
        if(!admin) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // validate group existence 
        if(!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }

        // ensure only admin can add members
        if(!group.admins.includes(adminID)) {
            await session.abortTransaction();
            return res.status(403).json({ message: "Only admin can add members" });
        }

        // validate associated chat existence
        if (!chat) {
            await session.abortTransaction();
            return res.status(500).json({ message: "Associated chat not found" });
        } 

        // process members to add
        const existingMembers = new Set(group.members.map(m => m.user));
        const newUsers = await User.find({
            userID: { $in: userIDs.filter(u => !existingMembers.has(u)) },
            isDeleted: { $ne: true }
        }).session(session).select("-_id -__v -password").lean();

        if (newUsers.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "No valid new members to add" });
        }

        // update group members and chat participants
        const date = new Date();

        const [updatedGroup] = await Promise.all([
            Group.findOneAndUpdate(
                { groupID },
                { $push: { members: { $each: newUsers.map(u => ({ user: u.userID, joinedAt: date })) }}},
                { new: true, lean: true, session }
            ),

            Chat.updateOne(
                { chatID: chat.chatID },
                { $addToSet: { participants: { $each: newUsers.map(u => u.userID) }}},
                { session }
            )
        ]);

        // create announcement message text
        const firstAdded = newUsers[0].name;
        let announcement = `added ${firstAdded}`;
        if (newUsers.length > 1) {
            announcement += ` and ${newUsers.length - 1} other${newUsers.length > 2 ? "s" : ""}`;
        }
        announcement += " to the group";

        // create and save system announcement message 
        await createAnnouncementMessage({
            chatID: chat.chatID,
            sender: adminID,
            text: announcement,
            session
        });

        await session.commitTransaction();

        res.status(200).json({ 
            message: `${newUsers.length} member${newUsers.length == 1 ? '' : 's'} added successfully`,
            group: updatedGroup,
            addedUsers: newUsers.map(u => ({...u, joinedAt: date}))
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error in add member controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

// remove a specefic member from a group 
const removeMember = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const adminID = req.user.userID;
        const memberID = parseInt(req.params.userID);
        const groupID = parseInt(req.params.groupID);

        // get data from db
        const [admin, member, group, chat] = await Promise.all([
            User.findOne({userID: adminID, isDeleted: { $ne: true }}).session(session).select("userID").lean(),
            User.findOne({userID: memberID, isDeleted: { $ne: true }}).session(session).select("userID name").lean(),
            Group.findOne({groupID}).session(session).select("groupID members admins").lean(),
            Chat.findOne( { group: groupID }).session(session).select("chatID").lean()
        ]);

        // validate group existence
        if(!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }

        // validate member && admin existence
        if(!member || !admin) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // ensure only admin can remove a member
        if(!group.admins.includes(adminID)) {
            await session.abortTransaction();
            return res.status(403).json({ message: "Only admin can remove members" });
        }

        // ensure removed user is already a member
        const isAlreadyMember = group.members.some(m => m.user === memberID);
        if (!isAlreadyMember) {
            await session.abortTransaction();
            return res.status(400).json({ message: "User is not a member of the group" });
        }

        // validate associated chat existence
        if (!chat) {
            await session.abortTransaction();
            return res.status(500).json({ message: "Associated chat not found" });
        } 

        const [updatedGroup] = await Promise.all([
            // remove user from members and admins
            Group.findOneAndUpdate(
                { groupID },
                {
                    $pull: { members: { user: memberID }, admins: memberID }
                },
                { new: true, lean: true, session } 
            ),

            // remove user from chat participants
            Chat.updateOne(
                { chatID: chat.chatID },
                { $pull: { participants: memberID }},
                { session }                
            )
        ]);

        // create and save system announcement message 
        await createAnnouncementMessage({
            chatID: chat.chatID,
            sender: adminID,
            text: `removed ${member.name} from the group`,
            session
        });

        await session.commitTransaction();

        res.status(200).json({ message: "Member removed successfully", group: updatedGroup});        

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in remove member controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

// promote a member to an admin of the group
const addAdmin = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const adminID = req.user.userID;
        const newAdminID = parseInt(req.params.userID);
        const groupID = parseInt(req.params.groupID);

        // get data from db
        const [admin, newAdmin, group, chat] = await Promise.all([
            User.findOne({userID: adminID, isDeleted: { $ne: true }}).session(session).select("userID").lean(),
            User.findOne({userID: newAdminID, isDeleted: { $ne: true }}).session(session).select("userID name").lean(),
            Group.findOne({groupID}).session(session).select("groupID members admins").lean(),
            Chat.findOne({ group: groupID }).session(session).select("chatID").lean()
        ]);

        // validate group existence
        if(!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }

        // validate admin && newAdmin existence
        if(!newAdmin || !admin) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // ensure only admin can promote
        if(!group.admins.includes(adminID)) {
            await session.abortTransaction();
            return res.status(403).json({ message: "Only admin can promote a member to admin" });
        }

        // ensure promoted user is already a member
        const isAlreadyMember = group.members.some(m => m.user === newAdminID);
        if (!isAlreadyMember) {
            await session.abortTransaction();
            return res.status(400).json({ message: "User must be a member of the group" });
        }

        // ensure that promoted member is not already an admin
        if (group.admins.includes(newAdminID)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "User is already an admin of the group" });
        }

        // validate associated chat existence
        if (!chat) {
            await session.abortTransaction();
            return res.status(500).json({ message: "Associated chat not found" });
        } 

        // add user to admins 
        const updatedGroup = await Group.findOneAndUpdate(
            { groupID },
            {
                $addToSet: { admins: newAdminID }
            },
            { new: true, lean: true, session } 
        );
        
        // create and save system announcement message 
        await createAnnouncementMessage({
            chatID: chat.chatID,
            sender: adminID,
            text: `promoted ${newAdmin.name} to admin`,
            session
        });

        await session.commitTransaction();

        res.status(200).json({ message: `${newAdmin.name} has been promoted to admin.`, group: updatedGroup});        

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in add admin controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

// demote a user from admin 
const removeAdmin = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const adminID = req.user.userID;
        const targetUserID = parseInt(req.params.userID);
        const groupID = parseInt(req.params.groupID);

        // get data from db
        const [admin, targetUser, group, chat] = await Promise.all([
            User.findOne({ userID: adminID, isDeleted: { $ne: true } }).session(session).select("userID").lean(),
            User.findOne({ userID: targetUserID, isDeleted: { $ne: true } }).session(session).select("userID name").lean(),
            Group.findOne({ groupID }).session(session).select("groupID admins").lean(),
            Chat.findOne({ group: groupID }).session(session).select("chatID").lean()
        ]);

        // validate admin and targetUser existence
        if (!admin || !targetUser) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // validate group existence
        if (!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }

        // validate associated chat existence
        if (!chat) {
            await session.abortTransaction();
            return res.status(500).json({ message: "Associated chat not found" });
        } 

        // ensure only admin can demote other admins
        if (!group.admins.includes(adminID)) {
            await session.abortTransaction();
            return res.status(403).json({ message: "Only admin can demote other admins" });
        }

        // ensure that target user is already an admin
        if (!group.admins.includes(targetUserID)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "User is not an admin" });
        }

        // Prevent demoting the last admin
        if (group.admins.length === 1 && group.admins[0] === targetUserID) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Cannot remove the only remaining admin" });
        }

        // Remove user from admins
        const updatedGroup = await Group.findOneAndUpdate(
            { groupID },
            {
                $pull: { admins: targetUserID }
            },
            { new: true, lean: true, session }
        );

        // create and save system announcement message 
        await createAnnouncementMessage({
            chatID: chat.chatID,
            sender: adminID,
            text: `removed ${targetUser.name} from admin role`,
            session
        });

        await session.commitTransaction();

        res.status(200).json({ message: `${targetUser.name} is no longer an admin.`, group: updatedGroup });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in removeAdmin controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

// leave a specefic group
const leaveGroup = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);   

        // get data from db
        const [user, group, chat] = await Promise.all([
            User.findOne({userID, isDeleted: { $ne: true }}).session(session).select("userID").lean(),
            Group.findOne({groupID}).session(session).select("groupID members admins").lean(),
            Chat.findOne({ group: groupID }).session(session).select("chatID").lean()
        ]);

        // validate user existence
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // validate group existence
        if (!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }

        // validate associated chat existence
        if (!chat) {
            await session.abortTransaction();
            return res.status(500).json({ message: "Associated chat not found" });
        } 

        // ensure user is already a member
        const isMember = group.members.some(m => m.user === userID);
        if (!isMember) {
            await session.abortTransaction();
            return res.status(400).json({ message: "You are not a member of this group" });
        }

        // if user is the last member then delete group, chat, and messages
        if (group.members.length === 1) {
            await Promise.all([
                Group.deleteOne({ groupID }, { session }),
                Chat.deleteOne({ group: groupID }, { session }),
                Message.deleteMany({ chatID: chat.chatID }, { session })
            ]);

            await session.abortTransaction();
            return res.status(200).json({ message: "You left the group", group: null });
        }

        // remove user from group (members + admins) and from chat participants
        const [updatedGroup] = await Promise.all([
            Group.findOneAndUpdate(
                { groupID },
                {
                    $pull: { members: { user: userID }, admins: userID }
                },
                { new: true, lean: true, session }
            ),

            Chat.updateOne(
                { chatID: chat.chatID },
                { $pull: { participants: userID }},
                { session }
            )
        ]);

        // create and save announcement message (left the group)
        await createAnnouncementMessage({
            chatID: chat.chatID,
            sender: userID,
            text: "left the group",
            session
        });
    
        // check if admins are empty then assign new one
        if (updatedGroup.admins.length === 0) {
            // get new admin ID
            const newAdminID = updatedGroup.members[0]?.user;

            // push new admin
            const [newGroup] = await Group.findOneAndUpdate(
                { groupID },
                { $push: { admins: newAdminID } },
                { new: true, lean: true, session }
            );

            // create and save system announcement message (new admin)
            await createAnnouncementMessage({
                chatID: chat.chatID,
                sender: newAdminID,
                text: "is now the new admin",
                session
            });

            await session.commitTransaction();

            return res.status(200).json({ message: "You left the group", group: newGroup });
        }

        await session.commitTransaction();

        res.status(200).json({ message: "You left the group", group: updatedGroup });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in leave group controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

/* ********* managing requests ********* */

// send a join request to a specefic group
const sendJoinRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);   

        // get data from db
        const [user, group] = await Promise.all([
            User.findOne({userID, isDeleted: { $ne: true }}).session(session).select("userID sentJoinRequests").lean(),
            Group.findOne({groupID}).session(session).select("groupID members joinRequests").lean()
        ]);

        // validate user existence
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // validate group existence
        if (!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }

        // ensure requester is not already a member
        const isAlreadyMember = group.members.some(m => m.user === userID);
        if (isAlreadyMember) {
            await session.abortTransaction();
            return res.status(400).json({ message: "You are already a member of this group" });
        }

        // ensure request is not already sent
        const alreadyRequested = group.joinRequests.some(r => r.user === userID) && user.sentJoinRequests.some(r => r.group === groupID);
        if (alreadyRequested) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Join request already sent." });
        }

        // update user and group
        const date = new Date();
        const [updatedGroup, updatedUser] = await Promise.all([
            // add request to group's joinRequests array
            Group.findOneAndUpdate(
                { groupID },
                { $addToSet: { joinRequests: { user: userID, requestedAt: date }}},
                { new: true, lean: true, session } 
            ),
        
            // add request to user's sentJoinrequests array
            User.findOneAndUpdate(
                { userID },
                { $addToSet: { sentJoinRequests: { group: groupID, requestedAt: date } } },
                { new: true, lean: true, session } 
            ).select("-_id -__v -password")
        ]);

        await session.commitTransaction();

        res.status(200).json({ 
            message: "Join request sent successfully.", 
            group: updatedGroup, 
            user: updatedUser, 
            request : { ...updatedGroup, requestedAt: date}
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error in send join request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

// cancel an already sent join request
const cancelJoinRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const userID = req.user.userID;
        const groupID = parseInt(req.params.groupID);

        // get data from db
        const [user, group] = await Promise.all([
            User.findOne({userID, isDeleted: { $ne: true }}).session(session).select("userID sentJoinRequests").lean(),
            Group.findOne({groupID}).session(session).select("groupID joinRequests").lean()
        ]);

        // validate user existence
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // validate group existence
        if (!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }

        // ensure request is already sent
        const requested = group.joinRequests.some(r => r.user === userID) && user.sentJoinRequests.some(r => r.group === groupID);
        if (!requested) {
            await session.abortTransaction();
            return res.status(400).json({ message: "No pending request to cancel." });
        }

        // update user and group
        const [updatedGroup, updatedUser] = await Promise.all([
            // remove request from group's joinRequests
            Group.findOneAndUpdate(
                { groupID },
                {
                    $pull: { joinRequests: { user: userID } }
                },
                { new: true, lean: true, session } 
            ),

            // remove request from user's sentJoinRequests
            User.findOneAndUpdate(
                { userID },
                {
                    $pull: { sentJoinRequests: { group: groupID } }
                },
                { new: true, lean: true, session } 
            ).select("-_id -__v -password")
        ]);

        await session.commitTransaction();

        res.status(200).json({ 
            message: "Join request canceled successfully", 
            group: updatedGroup, 
            user: updatedUser 
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error in cancel join request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

// accept a receieved join request to my group
const acceptJoinRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const adminID = req.user.userID;
        const requesterID = parseInt(req.params.userID);
        const groupID = parseInt(req.params.groupID);

        // get data from db
        const [admin, requester, group, chat] = await Promise.all([
            User.findOne({userID: adminID, isDeleted: { $ne: true }}).session(session).select("userID").lean(),
            User.findOne({userID: requesterID, isDeleted: { $ne: true }}).session(session).select("userID sentJoinRequests").lean(),
            Group.findOne({groupID}).session(session).select("groupID joinRequests admins").lean(),
            Chat.findOne({group: groupID}).session(session).select("chatID").lean()
        ]);

        // validate user existence
        if (!admin || !requester) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // validate group existence
        if (!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }
        
        // validate associated chat existence
        if(!chat) {
            await session.abortTransaction();
            return res.status(500).json({ message: "Associated chat not found" });
        }

        // ensure only admin can accept join requests
        if(!group.admins.includes(adminID)) {
            await session.abortTransaction();
            return res.status(403).json({ message: "Only admin can accept join requests" });
        }

        // ensure request is already sent
        const requested = group.joinRequests.some(r => r.user === requesterID) && requester.sentJoinRequests.some(r => r.group === groupID);
        if (!requested) {
            await session.abortTransaction();
            return res.status(400).json({ message: "No pending request to accept." });
        }

        // update data
        const date = new Date();
        const [updatedGroup, updatedRequester] = await Promise.all([
            // add user to members and remove request from joinRequests
            Group.findOneAndUpdate(
                { groupID },
                {
                    $addToSet: { members: { user: requesterID, joinedAt: date } },
                    $pull: { joinRequests: { user: requesterID } }
                },
                { new: true, lean: true, session } 
            ),

            // remove request from user's sentJoinRequests
            User.findOneAndUpdate(
                { userID: requesterID },
                {
                    $pull: { sentJoinRequests: { group: groupID } }
                },
                { new: true, lean: true, session }
            ).select("-_id -__v -password"),

            // add user to chat participants
            Chat.updateOne(
                { chatID: chat.chatID },
                { $addToSet: { participants: requesterID } },
                { session }
            )
        ]);

        // create and save system announcement message 
        await createAnnouncementMessage({
            chatID: chat.chatID,
            sender: requesterID,
            text: `joined the group`,
            session
        });

        await session.commitTransaction();

        res.status(200).json({ 
            message: "Join request accepted", 
            group: updatedGroup, 
            addedUser: { ...updatedRequester, joinedAt: date} 
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in accept join request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
};

// decline a receieved join request to my group
const declineJoinRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const adminID = req.user.userID;
        const requesterID = parseInt(req.params.userID);
        const groupID = parseInt(req.params.groupID);

        // get data from db
        const [admin, requester, group] = await Promise.all([
            User.findOne({userID: adminID, isDeleted: { $ne: true }}).session(session).select("userID").lean(),
            User.findOne({userID: requesterID, isDeleted: { $ne: true }}).session(session).select("userID sentJoinRequests").lean(),
            Group.findOne({groupID}).session(session).select("groupID joinRequests admins").lean(),
        ]);

        // validate user existence
        if (!admin || !requester) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // validate group existence
        if (!group) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Group not found" });
        }
        
        // ensure only admin can decline join requests
        if(!group.admins.includes(adminID)) {
            await session.abortTransaction();
            return res.status(403).json({ message: "Only admin can accept join requests" });
        }

        // ensure request is already sent
        const requested = group.joinRequests.some(r => r.user === requesterID) && requester.sentJoinRequests.some(r => r.group === groupID);
        if (!requested) {
            await session.abortTransaction();
            return res.status(400).json({ message: "No pending request to accept." });
        }

        // update data
        const [updatedGroup] = await Promise.all([
            // remove request from group's joinRequests
            Group.findOneAndUpdate(
                { groupID },
                {
                    $pull: { joinRequests: { user: requesterID } }
                },
                { new: true, lean: true, session }
            ),

            // remove request from user's sentJoinRequests
            User.updateOne(
                { userID: requesterID },
                {
                    $pull: { sentJoinRequests: { group: groupID } }
                },
                { session }
            )
        ]);

        await session.commitTransaction();

        res.status(200).json({ 
            message: "Join request declined", 
            group: updatedGroup, 
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error in decline join request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
};

module.exports = {
    getGroups, getGroupDetails, getAdminGroups, getMemberGroups, getGroupMembers, getFriendMembers,
    createGroup, updateGroup, removeGroup,
    addMembers, removeMember, addAdmin, removeAdmin, leaveGroup,
    getPendingJoinRequests, sendJoinRequest, cancelJoinRequest, acceptJoinRequest, declineJoinRequest
}