const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { 
    getGroups, getGroupDetails, getGroupMembers, 
    createGroup, updateGroup, removeGroup 
} = require("../controllers/group.controller");


// route is /api/group

router.get("/search", getGroups);
router.get("/members/:groupID", getGroupMembers);
router.get("/:groupID", getGroupDetails);

router.use(authMiddleware);

router.post("/", createGroup);
router.put("/:groupID", updateGroup);
router.delete("/:groupID", removeGroup);


module.exports = router;