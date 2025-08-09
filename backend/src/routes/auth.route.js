const express = require("express");
const router = express.Router();

const { signup, login, logout, checkAuth } = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

// route is /api/auth

router.post('/signup', signup);

router.post("/login", login);

router.post("/logout",authMiddleware, logout);

router.get("/check", authMiddleware, checkAuth);

module.exports = router;