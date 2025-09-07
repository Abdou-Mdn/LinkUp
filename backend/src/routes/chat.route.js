const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { 
    getChats, getChatMessages, getPrivateChat, getGroupChat,
    sendMessage,
    markMessagesAsSeen,
    editMessage,
    deleteMessage,
    sendGroupInvites
} = require("../controllers/chat.controller");

// route is /api/chat

// protected routes
router.use(authMiddleware);

// chats 
router.get("/", getChats);
router.get("/private/:userID", getPrivateChat);
router.get("/group/:groupID", getGroupChat);
router.put("/seen/:chatID", markMessagesAsSeen);

// messages
router.get("/messages/:chatID", getChatMessages);
router.post("/message", sendMessage);
router.put("/message/:messageID", editMessage);
router.delete("/message/:messageID", deleteMessage);
router.post("/invite", sendGroupInvites);

module.exports = router;