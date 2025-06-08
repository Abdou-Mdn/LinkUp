const User = require("../models/user.model");


const getUsers = async (req, res) => {
    try {
        const name = req.query.name || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // creating filter to get the users with names that include the provided name 
        const filter = {
            name: { $regex: name, $options: 'i'}, // case insensitive search
        };

        const total = await User.countDocuments(filter); // getting the total users 

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

        const user = User.findOne({ userID }).select("-password -_id -__v");

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
        const user = await User.findOne({ userID }).select("friends");
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
        };

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        const total = await User.countDocuments(filter);

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
        const user = await User.findOne({ userID }).select("friendRequests");
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

        const requesters = await User.find({ userID: { $in: requestIDs } })
            .select("userID name profilePic");

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

        const currentUser = await User.findOne({ userID: currentUserID }).select("friends");
        const otherUser = await User.findOne({ userID: otherUserID }).select("friends");

        if (!currentUser || !otherUser) {
            return res.status(404).json({ message: "One or both users not found" });
        }

        const currentUserFriends = currentUser.map(f => f.user);
        const otherUserFriends = otherUser.map(f => f.user);

        const mutualIDs = currentUserFriends.filter(id => otherUserFriends.has(id));

        if (mutualIDs.length === 0) {
            return res.json({ mutualFriends: [] });
        }

        const mutualFriends = await User.find({ userID: { $in: mutualIDs } })
            .select("userID name profilePic lastSeen");

        res.json({ mutualFriends });

    } catch (error) {
        console.error("Error in getMutualFriends controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    getUsers, getUserDetails, getFriends, getFriendRequests, getMutualFriends
}