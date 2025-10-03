const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { 
    getGroups, getGroupDetails, getAdminGroups, getMemberGroups, getGroupMembers, getFriendMembers,
    createGroup, updateGroup, removeGroup,
    addMembers, removeMember, addAdmin, removeAdmin, leaveGroup,
    getPendingJoinRequests, sendJoinRequest, cancelJoinRequest, acceptJoinRequest, declineJoinRequest, 
} = require("../controllers/group.controller");


// route is /api/group

// public routes
router.get("/search", getGroups);
router.get("/details/:groupID", getGroupDetails);


// protected routes 
router.use(authMiddleware);

// role specific groups
router.get("/admin-of/", getAdminGroups);
router.get("/member-of/", getMemberGroups);

// members 
router.get("/members/:groupID", getGroupMembers);
router.get("/members/:groupID/friends", getFriendMembers)

// manage group 
router.post("/", createGroup);
router.put("/update/:groupID", updateGroup);
router.delete("/remove/:groupID", removeGroup);

// manage members
router.post("/members/:groupID", addMembers);
router.delete("/members/:groupID/:userID", removeMember);
router.post("/admins/:groupID/:userID", addAdmin);
router.delete("/admins/:groupID/:userID", removeAdmin);
router.post("/leave/:groupID", leaveGroup);

// requests
router.get("/requests/:groupID", getPendingJoinRequests);
router.post("/request/:groupID", sendJoinRequest);
router.delete("/request/:groupID/cancel", cancelJoinRequest);
router.post("/request/:groupID/accept/:userID", acceptJoinRequest);
router.post("/request/:groupID/decline/:userID", declineJoinRequest);


module.exports = router;