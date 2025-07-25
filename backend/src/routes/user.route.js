const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { 
    getUsers, getUserDetails, 
    getFriends, getMutualFriends, removeFriend,
    updateProfile, updateEmail, updatePassword, deleteAccount, 
    getPendingFriendRequests, getSentFriendRequests, sendFriendRequest, cancelFriendRequest,
    acceptFriendRequest, declineFriendRequest, getSentJoinRequests
} = require("../controllers/user.controller");

// route is /api/user

// public routes
router.get('/search/', getUsers);
router.get("/details/:userID", getUserDetails);

// protected routes
router.use(authMiddleware);

// friends
router.get("/friends", getFriends);
router.get("/mutual/:userID",  getMutualFriends);
router.delete("/friend/:userID",  removeFriend);

// requests
router.get("/requests/recieved", getPendingFriendRequests);
router.get("/requests/sent", getSentFriendRequests);
router.get("/requests/sent/groups", getSentJoinRequests);
router.post("/request/:userID",  sendFriendRequest);
router.delete("/request/cancel/:userID", cancelFriendRequest);
router.post("/request/accept/:userID",  acceptFriendRequest);
router.post("/request/decline/:userID",  declineFriendRequest);

// profile update
router.put("/profile",  updateProfile);
router.put("/email",  updateEmail);
router.put("/password",  updatePassword);

// account 
router.delete("/", deleteAccount);

module.exports = router;