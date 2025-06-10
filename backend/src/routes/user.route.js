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

router.get('/search/', getUsers);

router.use(authMiddleware);

router.get("/friends", getFriends);
router.get("/requests", getFriendRequests);
router.get("/sentRequests", getPendingRequests);
router.get("/mutual/:userID",  getMutualFriends);

router.put("/profile",  updateProfile);
router.put("/email",  updateEmail);
router.put("/password",  updatePassword);

router.post("/request/:userID",  sendFriendRequest);
router.put("/request/:userID",  acceptFriendRequest);
router.delete("/request/:userID",  declineFriendRequest);
router.delete("/request/:userID/cancel", cancelFriendRequest);

router.delete("/:userID",  removeFriend);
router.delete("/", deleteAccount);

router.get("/:userID", getUserDetails);

module.exports = router;