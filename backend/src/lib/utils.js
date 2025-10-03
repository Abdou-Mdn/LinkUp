require("dotenv").config();
const jwt = require("jsonwebtoken");

// generate JWT and set it as an HTTP-only cookie
const generateToken = (userID, res) => {
    // Creates a signed JWT with userID payload
    const token = jwt.sign(
        {userID}, 
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    // send token to client as an HTTP-only cookie for security
    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // expires in 7 days (in ms)
        httpOnly: true, // prevents JavaScript access (XSS protection)
        sameSite: "strict", // CSRF protection
        secure: process.env.NODE_ENV != "development" // // Secure only in production
    });

    return token;
}

// clear token by setting an expired JWT
const clearToken = (res) => {
    // send empty token as a cookie with 0ms of age
    res.cookie("jwt", "", {
        maxAge: 0,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
    });
}

module.exports = { generateToken, clearToken };