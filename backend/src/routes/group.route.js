const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { 
    getGroups, getGroupDetails, getAdminGroups, getMemberGroups, getGroupMembers, getFriendMembers,
    createGroup, updateGroup, removeGroup,
    addMember, removeMember, addAdmin, removeAdmin, leaveGroup,
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
router.put("/:groupID", updateGroup);
router.delete("/:groupID", removeGroup);

// manage members
router.post("/:groupID/members/:userID", addMember);
router.delete("/:groupID/members/:userID", removeMember);

router.post("/:groupID/admins/:userID", addAdmin);
router.delete("/:groupID/admins/:userID", removeAdmin);
router.post("/leave/:groupID", leaveGroup);

// requests
router.get("/requests/:groupID", getPendingJoinRequests);
router.post("/request/:groupID", sendJoinRequest);
router.delete("/request/:groupID/cancel", cancelJoinRequest);
router.post("/request/:groupID/accept/:userID", acceptJoinRequest);
router.post("/request/:groupID/decline/:userID", declineJoinRequest);


module.exports = router;