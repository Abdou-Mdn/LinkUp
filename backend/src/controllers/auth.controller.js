const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const generateToken = require("../lib/utils");

const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // validating the data received
        // checking if any field is empty 
        if(!name || !email || !password) {
            return res.status(400).json({"message": "All fields are required"});
        }

        //checking if password is less than 8 characters
        if(password.length < 8) {
            return res.status(400).json({"message": "Password must be at least 8 characters"});
        }

        // checking if a user is already registered with the provided email
        const user = await User.findOne({email, isDeleted: { $ne: true }});

        if(user) {
            return res.status(400).json({"message": "Email already registered"});
        }

        // hasing the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // saving the new user inside the database
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        if(newUser) {
            const savedUser = await newUser.save();
            const { password, ...userWithoutPassword } = savedUser.toObject();
            generateToken(savedUser.userID, res);
            res.status(201).json({
                user: userWithoutPassword
            });
        } else {
            res.status(400).json({"message": "Invalid user data"});
        }

    } catch (error) {
        console.error("Error in signup controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const login = async (req,res) => {
    const {email, password} = req.body; 
    try {
        //finding the registered user with the provided email
        const user = await User.findOne({email, isDeleted: { $ne: true }}).select("-_id -__v");
        
        if(!user) {
            // no user registered with the provided email
            return res.status(400).json({"message": "Invalid credentials"});
        }
        
        // checking if the provided password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        
        if(!isPasswordCorrect) {
            // incorrect password
            return res.status(400).json({"message": "Invalid credentials"});
        }

        const { password, ...userWithoutPassword } = user.toObject();
        generateToken(user.userID,res);

        res.status(200).json({ user: userWithoutPassword });

    } catch (error) {
        console.error("Error in login contoller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const logout = (req,res) => {
    try {
        // deleting the cookie
        res.cookie("jwt","",{maxAge: 0});
        res.status(200).json({"message": "Logged out seccussfully "});
    } catch (error) {
        console.error("Error in logout contoller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const checkAuth = (req,res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

module.exports =  {
    signup, login, logout, checkAuth
}