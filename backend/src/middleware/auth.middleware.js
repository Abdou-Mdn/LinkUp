const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/* 
    Authentication middleware
    protects routes by verifying JWT tokens stored in cookies
     - if valid, attaches the authenticated user object to req.user
     - if not, returns appropriate error response (401/404/500)
*/
const authMiddleware = async (req,res,next) => {
    try {
        // extract token from cookies
        const token = req.cookies.jwt;
        
        if(!token) {
            return res.status(401).json({"message": "Unauthorized - No token provided"});
        }

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded) {
            return res.status(401).json({"message": "Unauthorized - Invalid token"});
        }

        // find user in DB (exclude password and unnecessary fields)
        const user = await User.findOne({userID: decoded.userID}).select("-password -_id -__v");

        if(!user) {
            return res.status(404).json({"message": "User not found"});
        }

        // attach user to request object
        req.user = user;
        
        // pass control to next middleware/route
        next();

    } catch (error) {
        console.error("Error in auth middleware", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

module.exports = authMiddleware;