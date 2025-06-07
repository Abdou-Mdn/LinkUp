require("dotenv").config();
const jwt = require("jsonwebtoken");

const generateToken = (userID, res) => {
    const token = jwt.sign(
        {userID}, 
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV != "development"
    });

    return token;
}

module.exports = generateToken;