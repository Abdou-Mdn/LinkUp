const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const authMiddleware = async (req,res,next) => {
    try {
        const token = req.cookies.jwt;
        if(!token) {
            return res.status(401).json({"message": "Unauthorized - No token provided"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded) {
            return res.status(401).json({"message": "Unauthorized - Invalid token"});
        }

        const user = await User.findOne({userID: decoded.userID}).select("-password -_id -__v");

        if(!user) {
            return res.status(404).json({"message": "User not found"});
        }

        req.user = user;
        next();

    } catch (error) {
        console.error("Error in auth middleware", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

module.exports = authMiddleware;