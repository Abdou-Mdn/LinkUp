const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Group = require("../models/group.model");
const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const cloudinary = require("../lib/cloudinary");
const { relevanceSearchPipeline } = require("../lib/queries");


/* ********* getting details ********* */

// fetch users based on provided name
const getUsers = async (req, res) => {
    try {
        const name = req.query.name || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // search filter (case-insensitive partial match on group name) 
        const filter = {
            name: { $regex: name, $options: 'i'}, // case insensitive search
            isDeleted: { $ne: true } // user shouldn't be deleted
        };

        const projection = {
            userID: 1,
            name: 1,
            profilePic: 1,
            bio: 1,
            friends: 1,
            lastSeen: 1,
            createdAt: 1
        }

        // parallel queries for optimization
        const [total, users] = await Promise.all([
            // count total number of users that match the filter
            User.countDocuments(filter),

            User.aggregate([
                { $match: filter },
                ...relevanceSearchPipeline(name, projection),
                { $skip: (page - 1) * limit },
                { $limit: limit }
            ])
        ])

        // return paginated response
        res.json({
            totalPages: Math.ceil(total / limit),
            users
        });
    } catch (error) {
        console.error("Error in get users controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

// fetch details of a specefic user
const getUserDetails = async (req, res) => {
    try {
        const userID = parseInt(req.params.userID);

        const user = await User.findOne({userID, isDeleted: { $ne: true }}).select("-password -_id -__v").lean();

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Error in get user details controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get full list of user's friends (only userID, name, profilePicture) 
const getFriendsIDs = async (req, res) => {
    try {
        const userID = req.user.userID;

        // validate user existence
        const user = await User.findOne({userID, isDeleted: { $ne: true }}).select("friends").lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // get all the friends ids
        const friendIDs = user.friends.map(f => f.user);

        // fetch friends informations
        const friends = await User.find({ userID: { $in: friendIDs }, isDeleted: { $ne: true }})
            .select("userID name profilePic")
            .lean()

        return res.json({ friends });
    } catch (error) {
        console.error("Error in get friends ids controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get list of user's friends (paginated)
const getFriends = async (req, res) => {
    try {
        const userID = req.user.userID
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // validate user existence
        const user = await User.findOne({userID, isDeleted: { $ne: true }}).select("friends").lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // get all the friends ids
        const friendIDs = user.friends.map(f => f.user);
        
        // if user has no friends we return an empty array 
        if (friendIDs.length === 0) {
            return res.json({
                totalPages: 0,
                friends: []
            });
        }

        // Build the filter for the friends list
        const filter = {
            userID: { $in: friendIDs },
            isDeleted: { $ne: true }
        };

        const [total, friends] = await Promise.all([
            User.countDocuments(filter),

            User.find(filter)
            .sort({ name: 1 }) // sorting the results alphabetically 
            .skip((page - 1) * limit)
            .limit(limit)
            .select("userID name profilePic lastSeen friends")
            .lean()
        ]);

        return res.json({
            totalPages: Math.ceil(total / limit),
            friends
        });

    } catch (error) {
        console.error("Error in get friends controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// get list of mutual friends between authenticated user and a specefic user
const getMutualFriends = async (req, res) => {
    try {
        const currentUserID = req.user.userID;
        const otherUserID = parseInt(req.params.userID);   

        if (currentUserID === otherUserID) {
            return res.status(400).json({ message: "Cannot get mutual friends with yourself" });
        }

        // get data from db 
        const [currentUser, otherUser] = await Promise.all([
            User.findOne({userID: currentUserID, isDeleted: { $ne: true }}).select("friends").lean(),
            User.findOne({userID: otherUserID, isDeleted: { $ne: true }}).select("friends").lean()
        ])

        // validate existence
        if (!currentUser || !otherUser) {
            return res.status(404).json({ message: "One or both users not found" });
        }

        // get friend IDs of each user's friends
        const currentUserFriends = currentUser.friends.map(f => f.user);
        const otherUserFriends = otherUser.friends.map(f => f.user);

        // get intersection of the two arrays
        const mutualIDs = currentUserFriends.filter(id => otherUserFriends.includes(id));

        // if no mutual friends return an empt array
        if (mutualIDs.length === 0) {
            return res.json({ mutualFriends: [] });
        }

        // get user infos
        const mutualFriends = await User.find({userID: { $in: mutualIDs }, isDeleted: { $ne: true }})
            .select("userID name profilePic lastSeen")
            .lean();

        res.json({ mutualFriends });

    } catch (error) {
        console.error("Error in get mutual friends controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get list of received friend requests (paginated)
const getPendingFriendRequests = async (req, res) => {
    try {
        const userID = req.user.userID
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // validate existence
        const user = await User.findOne({userID, isDeleted: { $ne: true }}).select("friendRequests").lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // sort requesters based on requested date (newest to oldest) 
        const sortedRequests = user.friendRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

        // apply manual pagination
        const total = sortedRequests.length;
        const startIndex = (page - 1) * limit;
        const paginatedRequests = sortedRequests.slice(startIndex, startIndex + limit);

        // return empty response if list is empty
        if (paginatedRequests.length === 0) {
            return res.json({
                totalPages: 0,
                requests: []
            });
        }

        // get all the requester IDs
        const requestIDs = paginatedRequests.map(f => f.user);

        // fetch user details for requesters 
        const requesters = await User.find({userID: { $in: requestIDs }, isDeleted: { $ne: true }})
            .select("userID name profilePic")
            .lean();

        // map back requestedAt values to requesters
        const requestedAtMap = new Map();
        paginatedRequests.forEach(req => {
            requestedAtMap.set(req.user, req.requestedAt);
        });

        const requests = requesters.map(u => ({
            ...u,
            requestedAt: requestedAtMap.get(u.userID)
        }));
        
        // return paginated response
        return res.json({
            totalPages: Math.ceil(total / limit),
            requests
        });

    } catch (error) {
        console.error("Error in get friend requests controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get list of sent friend requests (paginated)
const getSentFriendRequests = async (req, res) => {
    try {
        const userID = req.user.userID
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // validate existence
        const user = await User.findOne({userID, isDeleted: { $ne: true }}).select("sentFriendRequests").lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // sort requesters based on requested date (newest to oldest) 
        const sortedRequests = user.sentFriendRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

        // apply manual pagination
        const total = sortedRequests.length;
        const startIndex = (page - 1) * limit;
        const paginatedRequests = sortedRequests.slice(startIndex, startIndex + limit);

        // return empty response if list is empty
        if (paginatedRequests.length === 0) {
            return res.json({
                totalPages: 0,
                requests: []
            });
        }

        // get all the requester IDs
        const requestIDs = paginatedRequests.map(f => f.user);
        

       // fetch user details for requesters 
        const requesters = await User.find({userID: { $in: requestIDs }, isDeleted: { $ne: true }})
            .select("userID name profilePic")
            .lean();

        // map back requestedAt values to requesters
        const requestedAtMap = new Map();
        paginatedRequests.forEach(req => {
            requestedAtMap.set(req.user, req.requestedAt);
        });

        const requests = requesters.map(u => ({
            ...u,
            requestedAt: requestedAtMap.get(u.userID)
        }));
        
        // return paginated response
        return res.json({
            totalPages: Math.ceil(total / limit),
            requests
        });

    } catch (error) {
        console.error("Error in get sent friend requests controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get list of sent join requests (paginated)
const getSentJoinRequests = async (req, res) => {
    try {
        const userID = req.user.userID
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // validate existence
        const user = await User.findOne({userID, isDeleted: { $ne: true }}).select("sentJoinRequests").lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // sort requesters based on requested date (newest to oldest) 
        const sortedRequests = user.sentJoinRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

        // apply manual pagination
        const total = sortedRequests.length;
        const startIndex = (page - 1) * limit;
        const paginatedRequests = sortedRequests.slice(startIndex, startIndex + limit);

        // return empty response if list is empty
        if (paginatedRequests.length === 0) {
            return res.json({
                totalPages: 0,
                requests: []
            });
        }

        // get all the group IDs
        const requestIDs = paginatedRequests.map(f => f.group);

        // we find all the groups that are in the sent join requests array
        const groups = await Group.find({groupID: { $in: requestIDs }})
            .select("groupID name image")
            .lean();

        // map back requestedAt values to groups
        const requestedAtMap = new Map();
        paginatedRequests.forEach(req => {
            requestedAtMap.set(req.group, req.requestedAt);
        });

        const requests = requestIDs.map(id => {
            const group = groups.find(g => g.groupID === id);
            if (!group) return null;
            return {
                ...group,
                requestedAt: requestedAtMap.get(group.groupID)
            };
        }).filter(Boolean);
        
        return res.json({
            totalPages: Math.ceil(total / limit),
            requests
        });

    } catch (error) {
        console.error("Error in get sent join request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

 /* ********* managing profile ********* */ 

// edit profile informations
const updateProfile = async (req, res) => {
    try {
        const userID = req.user.userID;
        const { name, bio, profilePic, cover, birthdate, socials } = req.body;
        
        // validate existence
        const user = await User.findOne({userID, isDeleted: { $ne: true }});
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // handle update name
        if(name && name != user.name) user.name = name;
        
        // handle update bio
        if(bio != undefined && bio != user.bio) {
            if (bio.length > 150) {
                return res.status(400).json({ message: "Bio must be 150 characters or fewer" });
            }
            user.bio = bio;
        } 

        // handle update birthdate
        if(birthdate && birthdate != user.birthdate) user.birthdate = birthdate;
        
        // handle update socials
        if(socials && socials != user.socials) user.socials = socials;
        
        // handle update profile picture
        if(profilePic) {
            // uploading the pic to cloudinary first
            console.log("uploading profile pic to cloudinary");
            const uploadResponse = await cloudinary.uploader.upload(profilePic, {
                folder: "profiles"
            });
            console.log("profile pic uploaded successfully");
            user.profilePic = uploadResponse.secure_url;
        }

        // handle update cover image
        if(cover) {
            // uploading the pic to cloudinary first
            console.log("uploading cover to cloudinary");
            const uploadResponse = await cloudinary.uploader.upload(cover, {
                folder: "profiles"
            });
            console.log("cover uploaded successfully");
            user.cover = uploadResponse.secure_url;
        }

        // save changes to db
        await user.save();

        // exclude password from response
        const { password, ...userWithoutPassword } = user.toObject();

        res.json({ message: "Profile updated successfully", user: userWithoutPassword }); 
    } catch (error) {
        console.error("Error in update profile controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// update account email
const updateEmail = async (req, res) => {
    try {
        const userID = req.user.userID;
        const { email, password } = req.body;
        
        // validate input values
        if (!email || !password) {
            return res.status(400).json({ message: "All fields must be filled" })
        }

        // validate user existence
        const user = await User.findOne({userID, isDeleted: { $ne: true }});
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ensure email is not already registered
        const existingUser = await User.findOne({email, isDeleted: { $ne: true }}).select("userID").lean();
        if (existingUser && existingUser.userID !== userID) {
            return res.status(400).json({ message: "Email is already in use" });
        }

        // validate password
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
            return res.status(400).json({ message: "Incorrect password" })
        }

        // update email
        user.email = email; 
        await user.save();

        // exclude password from response
        const { password: pass, ...userWithoutPassword } = user.toObject();

        res.json({ message: "Email is updated successfully", user: userWithoutPassword }); 

    } catch (error) {
        console.error("Error in update email controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// update account password
const updatePassword = async (req, res) => {
    try {
        const userID = req.user.userID;
        const { currentPassword, newPassword } = req.body;
        
        // validate input values
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Please provide both current password and new password" })
        }

        // validate user existence
        const user = await User.findOne({userID, isDeleted: { $ne: true }});
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // validate password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password)
        if (!isValidPassword) {
            return res.status(400).json({ message: "Current password is incorrect" })
        }

        // ensure new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ message: "New password must be different from the current password" });
        }

        // ensure new password has at least 8 characters
        if (newPassword.length < 8){
            return res.status(400).json({ message: "New password must be at least 8 characters long" });
        } 
        
        // hash and update password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // exclude password from response
        const { password, ...userWithoutPassword } = user.toObject();

        res.json({ message: "Password is updated successfully", user: userWithoutPassword }); 

    } catch (error) {
        console.error("Error in update password controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// remove user account
const deleteAccount = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userID = req.user.userID;
        const { password } = req.body;

        // validate input values
        if (!password) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Please provide your password" })
        }

        // validate user existence 
        const user = await User.findOne({userID, isDeleted: { $ne: true }}).session(session).select("userID password").lean();
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // validate password
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Incorrect password" })
        }

        // parallel updates
        await Promise.all([
            // soft delete
            User.updateOne(
                { userID },
                {
                    $set: {
                        friends: [],
                        sentFriendRequests: [],
                        sentJoinRequests: [],
                        name: "Deleted Account",
                        profilePic: "",
                        isDeleted: true
                    }
                },
                { session }
            ),

            // remove user from all their friends' lists
            User.updateMany(
                { 
                    $or: [
                        { "friends.user": userID }, // already friends
                        { "friendRequests.user": userID }, // received friend request from userID
                        { "sentFriendRequests.user": userID } // sent friend request to userID
                    ] 
                },
                { 
                    $pull: { 
                        friends: { user: userID }, 
                        friendRequests: { user: userID },
                        sentFriendRequests: { user: userID }
                    }
                },
                { session }
            ),

            // remove user from all groups' lists
            Group.updateMany(
                {
                    $or: [
                        { "members.user" : userID },
                        { "joinRequests.user": userID }
                    ]
                },
                { 
                    $pull: { 
                        members: { user: userID },
                        joinRequests: { user: userID }
                    }
                },
                { session }
            )
        ]);

        await session.commitTransaction();

        res.status(200).json({ message: "Account deleted successfully"});

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in delete account controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

 /* ********* managing friends & requests ********* */

// remove a specefic user from friends
const removeFriend = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userID = req.user.userID;
        const friendID = parseInt(req.params.userID);

        // get data from db
        const [user, friend] = await Promise.all([
            User.findOne({userID, isDeleted: { $ne: true }}).session(session).select("userID").lean(),
            User.findOne({userID: friendID, isDeleted: { $ne: true }}).session(session).select("userID").lean(),
        ])
        
        // validate users existence
        if (!user || !friend) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found." });
        }

        const [updatedUser, updatedFriend] = await Promise.all([
            // remove friend from user's friends
            User.findOneAndUpdate(
                { userID, isDeleted: { $ne: true }},
                { $pull: { friends: { user: friendID }}},
                { new: true, lean: true, session }
            ).select("-password -_id -__v"),

            // remove user from friend's friends
            User.findOneAndUpdate(
                { userID: friendID, isDeleted: { $ne: true }},
                { $pull: { friends: { user: userID }}},
                { new: true, lean: true, session }
            ).select("-password -_id -__v")
        ]);

        // find private chat and delete
        const chat = Chat.findOneAndDelete({isGroup: false, participants: { $all: [userID, friendID] }})
            .session(session)
            .select("chatID")
            .lean();

        // delete all messages referencing the deleted chat
        if (chat) {
            await Message.deleteMany({ chat: chat.chatID }, { session });
        }

        await session.commitTransaction();
        
        res.status(200).json({ 
            message: "Friend removed successfully.", 
            user: updatedUser, 
            profile: updatedFriend 
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in remove friend controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}; 

// send a friend request to another user
const sendFriendRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const senderID = req.user.userID;
        const receiverID = parseInt(req.params.userID);   

        // ensure not adding yourself
        if (senderID === receiverID) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Cannot add yourself" });
        }

        // get data from db
        const [sender, receiver] = await Promise.all([
            User.findOne({userID: senderID, isDeleted: { $ne: true }}).session(session).select("userID friends").lean(),
            User.findOne({userID: receiverID, isDeleted: { $ne: true }}).session(session).select("userID friends friendRequests").lean()
        ]);
        
        // validate users existence
        if (!receiver || !sender) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // ensure users are not already friends
        const alreadyFriends = receiver.friends.some(f => f.user === senderID);
        if (alreadyFriends) {
            await session.abortTransaction();
            return res.status(400).json({ message: "You are already friends with this user." });
        }

        // ensure friend request is not already sent
        const alreadyRequested = receiver.friendRequests.some(r => r.user === senderID);
        if (alreadyRequested) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Friend request already sent." });
        }

        // parallel updates
        const date = new Date();
        const [updatedSender, updatedReceiver] = await Promise.all([
            // add request to sender's sentFriendRequests
            User.findOneAndUpdate(
                { userID: senderID, isDeleted: { $ne: true }},
                { $addToSet: { sentFriendRequests: { user: receiverID, requestedAt: date }}},
                { new: true, lean: true, session }
            ).select("-password -_id -__v"),

            // add request to receiver's friendRequests
            User.findOneAndUpdate(
                { userID: receiverID, isDeleted: { $ne: true }},
                { $addToSet: { friendRequests: { user: senderID, requestedAt: date }}},
                { new: true, lean: true, session }
            ).select("-password -_id -__v"),
        ]);
        
        await session.commitTransaction();

        res.status(200).json({ 
            message: "Friend request sent successfully.", 
            user: updatedSender, 
            profile: {...updatedReceiver, requestedAt: date}
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error in send friend request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

// cancel an already sent friend request
const cancelFriendRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const senderID = req.user.userID;
        const receiverID = parseInt(req.params.userID);
        
        // get data from db
        const [sender, receiver] = await Promise.all([
            User.findOne({userID: senderID, isDeleted: { $ne: true }}).session(session).select("userID sentFriendRequests").lean(),
            User.findOne({userID: receiverID, isDeleted: { $ne: true }}).session(session).select("userID friendRequests").lean()
        ]);

        // validate users existence
        if (!receiver || !sender) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // ensure request is already sent
        const requested = receiver.friendRequests.some(r => r.user === senderID) && sender.sentFriendRequests.some(r => r.user === receiverID);
        if (!requested) {
            await session.abortTransaction();
            return res.status(400).json({ message: "No friend request to cancel" });
        }

        // parallel updates
        const [updatedSender, updatedReceiver] = await Promise.all([
            // remove request from sender's sentFriendRequests
            User.findOneAndUpdate(
                { userID: senderID, isDeleted: { $ne: true }},
                { $pull: { sentFriendRequests: { user: receiverID }}},
                { new: true, lean: true, session }
            ).select("-password -_id -__v"),

            // remove request from receiver's friendRequests
            User.findOneAndUpdate(
                { userID: receiverID, isDeleted: { $ne: true }},
                { $pull: { friendRequests: { user: senderID }}},
                { new: true, lean: true, session }
            ).select("-password -_id -__v"),
        ]);
        
        await session.commitTransaction();

        res.status(200).json({ 
            message: "Friend request canceled successfully", 
            user: updatedSender, 
            profile: updatedReceiver 
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error in cancel friend request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}

// accept a receieved friend request
const acceptFriendRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const currentUserID = req.user.userID;
        const requesterID = parseInt(req.params.userID);

        // get data from db
        const [currentUser, requester] = await Promise.all([
            User.findOne({userID: currentUserID, isDeleted: { $ne: true }}).session(session).select("userID friends friendRequests").lean(),
            User.findOne({userID: requesterID, isDeleted: { $ne: true }}).session(session).select("userID friends sentFriendRequests").lean()
        ]);

        // validate users existence
        if (!currentUser || !requester) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // ensure request is already sent
        const requested = currentUser.friendRequests.some(r => r.user === requesterID) && requester.sentFriendRequests.some(r => r.user === currentUserID);
        if (!requested) {
            await session.abortTransaction();
            return res.status(400).json({ message: "No friend request from this user" });
        }

        // ensure users are not already friends
        const alreadyFriends = currentUser.friends.some(f => f.user === requesterID) && requester.friends.some(f => f.user === currentUserID);
        if (alreadyFriends) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Already friends." });
        }

        // parallel updates
        const date = new Date();
        const [updatedUser, updatedRequester] = await Promise.all([
            // update friends and friendRequests of current user
            User.findOneAndUpdate(
                { userID: currentUserID, isDeleted: { $ne: true }},
                { 
                    $pull: { friendRequests: { user: requesterID }},
                    $addToSet: { friends: { user: requesterID, friendsSince: date }}
                },
                { new: true, lean: true, session }
            ).select("-password -_id -__v"),

            // update friends and sentFriendRequests of requester
            User.findOneAndUpdate(
                { userID: requesterID, isDeleted: { $ne: true }},
                { 
                    $pull: { sentFriendRequests: { user: currentUserID }},
                    $addToSet: { friends: { user: currentUserID, friendsSince: date }}
                },
                { new: true, lean: true, session }
            ).select("-password -_id -__v"),
        ]);
        
        await session.commitTransaction();

        res.status(200).json({ 
            message: "Friend request accepted", 
            user: updatedUser, 
            profile: {...updatedRequester, friendsSince: date} 
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in accept friend request controller :", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
};

// decline a receieved friend request
const declineFriendRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const currentUserID = req.user.userID;
        const requesterID = parseInt(req.params.userID);

        // get data from db
        const [currentUser, requester] = await Promise.all([
            User.findOne({userID: currentUserID, isDeleted: { $ne: true }}).session(session).select("userID friendRequests").lean(),
            User.findOne({userID: requesterID, isDeleted: { $ne: true }}).session(session).select("userID sentFriendRequests").lean()
        ]);

        // validate users existence
        if (!currentUser || !requester) {
            await session.abortTransaction();
            return res.status(404).json({ message: "User not found" });
        }

        // ensure request is already sent
        const requested = currentUser.friendRequests.some(r => r.user === requesterID) && requester.sentFriendRequests.some(r => r.user === currentUserID);
        if (!requested) {
            await session.abortTransaction();
            return res.status(400).json({ message: "No friend request from this user" });
        }

        // parallel updates
        const [updatedUser, updatedRequester] = await Promise.all([
            // remove request from user's friendRequests
            User.findOneAndUpdate(
                { userID: currentUserID, isDeleted: { $ne: true }},
                { $pull: { friendRequests: { user: requesterID }}},
                { new: true, lean: true, session }
            ).select("-password -_id -__v"),

            // remove request from requester's sentFriendRequests
            User.findOneAndUpdate(
                { userID: requesterID, isDeleted: { $ne: true }},
                { $pull: { sentFriendRequests: { user: currentUserID }}},
                { new: true, lean: true, session }
            ).select("-password -_id -__v"),
        ]);

        await session.commitTransaction();

        res.status(200).json({ 
            message: "Friend request declined", 
            user: updatedUser, 
            profile: updatedRequester 
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in decline friend request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
}


module.exports = {
    getUsers, getUserDetails, 
    getFriendsIDs, getFriends, getMutualFriends, removeFriend,
    updateProfile, updateEmail, updatePassword, deleteAccount,
    getPendingFriendRequests, getSentFriendRequests, sendFriendRequest, cancelFriendRequest, 
    acceptFriendRequest, declineFriendRequest, getSentJoinRequests
}