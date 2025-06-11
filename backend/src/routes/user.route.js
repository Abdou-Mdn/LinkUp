const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { 
    getUsers, getUserDetails, getFriends, getFriendRequests, getMutualFriends, 
    updateProfile, updateEmail, updatePassword, deleteAccount, 
    sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, 
    getPendingRequests,
    cancelFriendRequest
} = require("../controllers/user.controller");

// route is /api/user

// public routes
router.get('/search/', getUsers);
router.get("/:userID", getUserDetails);

// protected routes
router.use(authMiddleware);

// friends and friends requests
router.get("/friends", getFriends);
router.get("/requests/recieved", getFriendRequests);
router.get("/requests/sent", getPendingRequests);
router.get("/mutual/:userID",  getMutualFriends);
router.delete("/friend/:userID",  removeFriend);

// request actions
router.post("/request/:userID",  sendFriendRequest);
router.delete("/request/:userID/cancel", cancelFriendRequest);
router.put("/request/:userID",  acceptFriendRequest);
router.delete("/request/:userID",  declineFriendRequest);

// profile update
router.put("/profile",  updateProfile);
router.put("/email",  updateEmail);
router.put("/password",  updatePassword);

// account 
router.delete("/", deleteAccount);

module.exports = router;