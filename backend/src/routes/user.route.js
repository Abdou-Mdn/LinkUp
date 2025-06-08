const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { getUsers, getUserDetails, getFriends, getFriendRequests, getMutualFriends } = require("../controllers/user.controller");

// route is /api/user

router.get('/search/', getUsers);

router.get("/friends", authMiddleware, getFriends);
router.get("/requests", authMiddleware, getFriendRequests);

router.get("/:userID", getUserDetails);
router.get("/mutual/:userID", authMiddleware, getMutualFriends);

module.exports = router;