const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { 
    getGroups, getGroupDetails, getGroupMembers, getFriendMembers,
    createGroup, updateGroup, removeGroup,
    addMember, removeMember, addAdmin, leaveGroup,
    getPendingJoinRequests, sendJoinRequest, cancelJoinRequest, acceptJoinRequest, declineJoinRequest, 
    
} = require("../controllers/group.controller");


// route is /api/group

// public routes
router.get("/search", getGroups);
router.get("/:groupID", getGroupDetails);


// protected routes 
router.use(authMiddleware);

// members 
router.get("/members/:groupID", getGroupMembers);
router.get("/members/:groupID/friends", getFriendMembers)

// manage group 
router.post("/", createGroup);
router.put("/:groupID", updateGroup);
router.delete("/:groupID", removeGroup);

// manage members
router.post("/:groupID/members/:userID", addMember);
router.delete("/:groupID/members/:userID", removeMember);

router.post("/:groupID/admins/:userID", addAdmin);
router.post("/leave/:groupID", leaveGroup);

// requests
router.get("/requests/:groupID", getPendingJoinRequests);
router.post("/request/:groupID", sendJoinRequest);
router.delete("/request/:groupID/cancel", cancelJoinRequest);
router.post("/request/:groupID/accept/:userID", acceptJoinRequest);
router.post("/request/:groupID/decline/:userID", declineJoinRequest);


module.exports = router;