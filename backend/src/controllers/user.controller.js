const User = require("../models/user.model");
const cloudinary = require("../lib/cloudinary");
const bcrypt = require("bcrypt");


const getUsers = async (req, res) => {
    try {
        const name = req.query.name || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // creating filter to get the users with names that include the provided name 
        const filter = {
            name: { $regex: name, $options: 'i'}, // case insensitive search
            isDeleted: { $ne: true } // user shouldn't be deleted
        };

        const total = await User.countDocuments(filter) // getting the total users 

        // getting the users
        const users = await User.find(filter) // applying the filter
            .skip((page - 1) * limit) // getting the requested page
            .limit(limit) // getting only the number requested
            .select("userID name profilePic lastSeen createdAt friends friendRequests"); // selecting the necessary fields only

        res.json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalResults: total,
            users
        });
    } catch (error) {
        console.error("Error in get users controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const getUserDetails = async (req, res) => {
    try {
        const userID = parseInt(req.params.userID);

        const user = User.findOne({userID, isDeleted: { $ne: true }}).select("-password -_id -__v");

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Error in getUserDetails controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getFriends = async (req, res) => {
    try {
        const { userID } = req.user.userID
        const name = req.query.name || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Find the user to get their friends list
        const user = await User.findOne({userID, isDeleted: { $ne: true }}).select("friends");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // get all the friends ids
        const requestIDs = user.friends.map(f => f.user);
        
        if (requestIDs.length === 0) {
            // if user has no friends we return an empty array 
            return res.json({
                page,
                limit,
                totalPages: 0,
                totalResults: 0,
                friends: []
            });
        }

        // Build the filter for the friends list
        const filter = {
            userID: { $in: requestIDs },
            isDeleted: { $ne: true }
        };

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        const total = await User.countDocuments(filter).notDeleted();

        const friends = await User.find(filter)
            .select("userID name profilePic lastSeen")
            .sort({ name: 1 }) // sorting the results alphabetically 
            .skip((page - 1) * limit)
            .limit(limit);

        return res.json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalResults: total,
            friends
        });

    } catch (error) {
        console.error("Error in getFriends controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getFriendRequests = async (req, res) => {
    try {
        const { userID } = req.user.userID
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Find the user to get their friends list
        const user = await User.findOne({userID, isDeleted: { $ne: true }}).select("friendRequests");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // we sort the requests based on the time requested 
        const sortedRequests = user.friendRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

        const total = sortedRequests.length;
        const startIndex = (page - 1) * limit;
        const paginatedRequests = sortedRequests.slice(startIndex, startIndex + limit);

        // get all the friends ids
        const requestIDs = paginatedRequests.map(f => f.user);
        
        if (requestIDs.length === 0) {
            // if user has no friends we return an empty array 
            return res.json({
                page,
                limit,
                totalPages: 0,
                totalResults: 0,
                requests: []
            });
        }

        // we find all the users that are in the friend requests array
        const requesters = await User.find({userID: { $in: requestIDs }, isDeleted: { $ne: true }})
            .select("userID name profilePic");

        // we map back all the requestedAt values to their users
        const requestedAtMap = new Map();
        paginatedRequests.forEach(req => {
            requestedAtMap.set(req.user, req.requestedAt);
        });

        const requests = requesters.map(u => ({
            ...u.toObject(),
            requestedAt: requestedAtMap.get(u.userID)
        }));
        
        return res.json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalResults: total,
            requests
        });

    } catch (error) {
        console.error("Error in getFriendRequests controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getMutualFriends = async (req, res) => {
    try {
        const currentUserID = req.user.userID;
        const otherUserID = parseInt(req.params.userID);   

        if (currentUserID === otherUserID) {
            return res.status(400).json({ message: "Cannot get mutual friends with yourself" });
        }

        // we select the friends array of the current and other user
        const currentUser = await User.findOne({userID: currentUserID, isDeleted: { $ne: true }})
            .select("friends");
        const otherUser = await User.findOne({userID: otherUserID, isDeleted: { $ne: true }})
            .select("friends");

        if (!currentUser || !otherUser) {
            return res.status(404).json({ message: "One or both users not found" });
        }

        // we get the friend ids of the current user and the other user
        const currentUserFriends = currentUser.map(f => f.user);
        const otherUserFriends = otherUser.map(f => f.user);

        // we look for the intersection between the two arrays
        const mutualIDs = currentUserFriends.filter(id => otherUserFriends.has(id));

        // if users have no mutual friends we return an empty array
        if (mutualIDs.length === 0) {
            return res.json({ mutualFriends: [] });
        }

        // we search all the users that are mutual friends of the current and other user
        const mutualFriends = await User.find({userID: { $in: mutualIDs }, isDeleted: { $ne: true }})
            .select("userID name profilePic lastSeen");

        res.json({ mutualFriends });

    } catch (error) {
        console.error("Error in getMutualFriends controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const updateProfile = async (req, res) => {
    try {
        const userID = req.user.userID;
        const { name, bio, profilePic, birthdate, socials } = req.body;
        
        const user = await User.findOne({userID, isDeleted: { $ne: true }});

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // updating the fields if provided
        if(name) user.name = name;
        if(bio) user.bio = bio;
        if(birthdate) user.birthdate = birthdate;
        if(socials) user.socials = socials;
        if(profilePic) {
            // uploading the pic to cloudinary first
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            user.profilePic = uploadResponse.secure_url;
        }

        await user.save();
        // excluding the password from the response
        const { password, ...userWithoutPassword } = user._doc;

        res.json({ message: "User is updated successfully", user: userWithoutPassword }); 
    } catch (error) {
        console.error("Error in update profile controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const updateEmail = async (req, res) => {
    try {
        const userID = req.user.userID;
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "All fields must be filled" })
        }

        const user = await User.findOne({userID, isDeleted: { $ne: true }});

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingUser = await User.findOne({email, isDeleted: { $ne: true }});

        // check if email is already registered
        if (existingUser && existingUser.userID !== userID) {
            return res.status(400).json({ message: "Email is already in use" });
        }

        // check if password is correct
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
            return res.status(400).json({ message: "Incorrect password" })
        }

        // update email
        user.email = email; 
        await user.save();
        // excluding the password from the response
        const { password: pass, ...userWithoutPassword } = user._doc;

        res.json({ message: "Email is updated successfully", user: userWithoutPassword }); 

    } catch (error) {
        console.error("Error in update email controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const updatePassword = async (req, res) => {
    try {
        const userID = req.user.userID;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Please provide both current password and new password" })
        }

        const user = await User.findOne({userID, isDeleted: { $ne: true }});

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // checking if current password is correct
        const isValidPassword = await bcrypt.compare(currentPassword, user.password)
        if (!isValidPassword) {
            return res.status(400).json({ message: "Current password is incorrect" })
        }

        // checking if the new password is different from the current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ message: "New password must be different from the current password" });
        }

        // new password should have more than 8 characters
        if (newPassword.length < 8){
            return res.status(400).json({ message: "New password must be at least 8 characters long" });
        } 
        
        // updating password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        const { password, ...userWithoutPassword } = user._doc;

        res.json({ message: "Password is updated successfully", user: userWithoutPassword }); 

    } catch (error) {
        console.error("Error in update password controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const deleteAccount = async (req, res) => {
    try {
        const userID = req.user.userID;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Please provide your password" })
        }

        const user = await User.findOne({userID, isDeleted: { $ne: true }});

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // check if password is correct
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
            return res.status(400).json({ message: "Incorrect password" })
        }

        user.isDeleted = true; 

        await user.save();

        res.status(200).json({ message: "Account deleted successfully"});

    } catch (error) {
        console.error("Error in delete controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const sendFriendRequest = async (req, res) => {
    try {
        const senderID = req.user.userID;
        const receiverID = parseInt(req.params.userID);   

        if (senderID === receiverID) {
            return res.status(400).json({ message: "Cannot add yourself" });
        }

        const sender = await User.findOne({userID: senderID, isDeleted: { $ne: true }});
        const receiver = await User.findOne({userID: receiverID, isDeleted: { $ne: true }});

        if (!receiver || !sender) {
            return res.status(404).json({ message: "User not found" });
        }

        // check if they are already friends
        const alreadyFriends = receiver.friends.some(f => f.user === senderID);
        if (alreadyFriends) {
            return res.status(400).json({ message: "You are already friends with this user." });
        }

        // check if request is already sent
        const alreadyRequested = receiver.friendRequests.some(r => r.user === senderID);
        if (alreadyRequested) {
            return res.status(400).json({ message: "Friend request already sent." });
        }


        // Add friend request to receiver
        receiver.friendRequests.push({
            user: senderID,
            requestedAt: new Date(),
        });

        await receiver.save();

        res.status(200).json({ message: "Friend request sent successfully."});
    } catch (error) {
        console.error("Error in send friend request controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const acceptFriendRequest = async (req, res) => {
    try {
        const currentUserID = req.user.userID;
        const requesterID = parseInt(req.params.userID);

        const currentUser = await User.findOne({userID: currentUserID, isDeleted: { $ne: true }});
        const requester = await User.findOne({userID: requesterID, isDeleted: { $ne: true }});

        if (!currentUser || !requester) {
            return res.status(404).json({ message: "User not found" });
        }

        // checking if the request exists
        const requestIndex = currentUser.friendRequests.findIndex(
            req => req.user === requesterID
        );

        if (requestIndex === -1) {
            return res.status(400).json({ message: "No friend request from this user" });
        }

        // add each other to friends
        currentUser.friends.push({ user: requesterID, friendsSince: new Date() });
        requester.friends.push({ user: currentUserID, friendsSince: new Date() });

        // remove the friend request
        currentUser.friendRequests.splice(requestIndex, 1);

        await currentUser.save();
        await requester.save();

        res.status(200).json({ message: "Friend request accepted" });

    } catch (error) {
        console.error("Error in acceptFriendRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const declineFriendRequest = async (req, res) => {
    try {
        const currentUserID = req.user.userID;
        const requesterID = parseInt(req.params.userID);

        const currentUser = await User.findOne({userID: currentUserID, isDeleted: { $ne: true }});

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // check if the request exists
        const requestIndex = currentUser.friendRequests.findIndex(
            req => req.user === requesterID
        );

        if (requestIndex === -1) {
            return res.status(400).json({ message: "No friend request from this user" });
        }

        // remove the friend request
        currentUser.friendRequests.splice(requestIndex, 1);
        await currentUser.save();

        res.status(200).json({ message: "Friend request declined" });

    } catch (error) {
        console.error("Error in declineFriendRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const removeFriend = async (req, res) => {
    try {
        const userID = req.user.userID;
        const friendID = parseInt(req.params.userID);

        if (userID === friendID) {
            return res.status(400).json({ message: "You cannot unfriend yourself." });
        }

        const user = await User.findOne({userID, isDeleted: { $ne: true }});
        const friend = await User.findOne({userID: friendID, isDeleted: { $ne: true }});

        if (!user || !friend) {
            return res.status(404).json({ message: "User not found." });
        }

        // remove friend from user's friends list
        user.friends = user.friends.filter(f => f.user !== friendID);

        // remove user from friend's friends list
        friend.friends = friend.friends.filter(f => f.user !== userID);

        await user.save();
        await friend.save();

        res.status(200).json({ message: "Friend removed successfully." });

    } catch (error) {
        console.error("Error in removeFriend controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getUsers, getUserDetails, getFriends, getFriendRequests, getMutualFriends, updateProfile,
    updateEmail, updatePassword, deleteAccount, sendFriendRequest, acceptFriendRequest, 
    declineFriendRequest, removeFriend
}