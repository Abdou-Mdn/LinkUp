const express = require("express");
const router = express.Router();

const { 
    signup, login, logout, checkAuth, 
    verifyEmail, sendCode, verifyCode, resetPassword 
} = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

// route is /api/auth

router.post('/signup', signup);

router.post("/login", login);

router.post("/logout", logout);

router.get("/check", authMiddleware, checkAuth);

router.post("/verify-email", verifyEmail);

router.post("/send-otp", sendCode);

router.post("/verify-otp", verifyCode);

router.post("/reset-password", resetPassword);

module.exports = router;