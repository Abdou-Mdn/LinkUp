require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const User = require("../models/user.model");
const transporter = require("../lib/nodemailer");
const { generateToken, clearToken} = require("../lib/utils");
const { otpTemplate } = require("../lib/emailTemplate");

//  register a new user account
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // validate required fields 
        if(!name || !email || !password) {
            return res.status(400).json({message: "All fields are required"});
        }

        // validate password length
        if(password.length < 8) {
            return res.status(400).json({message: "Password must be at least 8 characters"});
        }

        // check if email is already registered (ignoring soft deleted accounts)
        const existingUser = await User.findOne({email, isDeleted: { $ne: true }});
        if(existingUser) {
            return res.status(400).json({message: "Email already registered"});
        }

        // hash the password using bcrypt before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create new user instance
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        // save user to database
        const savedUser = await newUser.save();

        // remove password before sending response
        const { password: _, ...userWithoutPassword } = savedUser.toObject();
            
        // generate JWT token and send as a cookie
        generateToken(savedUser.userID, res);
        
        res.status(201).json({ user: userWithoutPassword });
        
    } catch (error) {
        console.error("Error in signup controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

// authenticate user and login
const login = async (req,res) => { 
    try {
        const {email, password} = req.body;

        // validate required fields
        if(!email || !password) {
            return res.status(400).json({message: "All fields are required"});
        }

        // validate password length
        if(password.length < 8) {
            return res.status(400).json({message: "Password must be at least 8 characters"});
        }

        // find user by email (excluding deleted ones)
        const user = await User.findOne({email, isDeleted: { $ne: true }});
        
        if(!user) {
            // no user registered with the provided email
            return res.status(400).json({message: "Invalid credentials"});
        }
        
        // compare password with hashed password in db
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        
        if(!isPasswordCorrect) {
            // incorrect password
            return res.status(400).json({message: "Invalid credentials"});
        }

        // remove password field before returning user
        const { password: _, ...userWithoutPassword } = user.toObject();
        
        // generate JWT token and send as cookie
        generateToken(user.userID,res);

        res.status(200).json({ user: userWithoutPassword });

    } catch (error) {
        console.error("Error in login contoller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

// logout user by clearing JWT cookie and updating lastSeen
const logout = async (req,res) => {
    try {
        const userID = req.user.userID;

        // find user in db
        const user = await User.findOne({userID});
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // update lastSeen
        user.lastSeen = new Date();
        await user.save();

        // clear the JWT cookie
        clearToken(res);

        res.status(200).json({message: "Logged out seccussfully "});
    
    } catch (error) {
        console.error("Error in logout contoller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

// check if user is authenticated
const checkAuth = (req,res) => {
    try {
        // user is already injected by authMiddleware
        res.status(200).json(req.user);
    
    } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

// check if email is already registered
const verifyEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if(!email) {
            return res.status(400).json({message: "Email is required"});
        }

        // find user by email (exclude deleted ones)
        const user = await User.findOne({email, isDeleted: { $ne: true }});
        
        if (!user) {
            return res.status(404).json({ message: "Email not registered" });
        }

        // send success message and userID
        res.json({ message: "Email verified", userID: user.userID });
    
    } catch (error) {
        console.log("Error in verify email controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

// send OTP code to provided email for password reset
const sendCode = async (req, res) => {
    try {
        const { email } = req.body;
        
        // ensure email is provided
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // check if user exists
        const user = await User.findOne({ email, isDeleted: { $ne: true } });
        if (!user) {
            return res.status(404).json({ message: "Email not registered" });
        }

        // enforce 1min cooldown between otp requests (prevent spamming)
        if (user.otp && (user.otp.lastSent > Date.now() - (60 * 1000))) {
            return res.status(429).json({ message: "You can request a new code after 1 minute" });
        }

        // generate 6 digit code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // hash code before saving to db
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);

        try {
            // send otp in email
            const info = await transporter.sendMail({
                from: `"LinkUp Team" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Password Reset Code",
                html: otpTemplate(user.name, otp),
                text: `Hi ${user.name},
                        We have received a request to reset your password.
                        Here is your verification code: ${otp}
                        (It expires in 10 minutes)

                        If you didn't request this, just ignore the message.

                        © ${new Date().getFullYear()} LinkUp Team.`
            });
            
            // save otp details in db
            user.otp = {
                code : hashedOTP,
                expires: new Date(Date.now() + 10 * 60 * 1000), // expires in 10min
                lastSent: new Date(),
                attempts: 0 
            }
            await user.save();

            res.json({ message: "Code sent to your email", emailID: info.messageId });   
        
        } catch (err) {
            console.error("Email send failed:", err.message);
            res.status(500).json({ message: "Failed to send email. Try again later." });
        }
    
    } catch (error) {
        console.log("Error in send code controller", error.message);
        res.status(500).json({message: "Internal server error"});    
    }
}

// verify OTP code and send reset token
const verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        // validate data
        if(!email || !code) {
            return res.status(400).json({message: "Email and Code are required"});
        }

        // check if user exists 
        const user = await User.findOne({ email, isDeleted: { $ne: true } });
        if (!user) {
            return res.status(404).json({ message: "Email not registered" });
        }

        // check if otp exists
        if (!user.otp || !user.otp.code) {
            return res.status(400).json({ message: "No code found. Please request a new one." });
        }

        // check if otp is not expired
        if (user.otp.expires < Date.now()) {
            // remove expired otp
            user.otp = undefined;
            await user.save();
            
            return res.status(400).json({ message: "Code has expired. Please request a new one." });
        }

        // compare otp codes
        const isMatch = await bcrypt.compare(code, user.otp.code);
        if (!isMatch) {
            // track failed attempts (brute-force protection)
            user.otp.attempts = (user.otp.attempts || 0) + 1;

            // if too many wrong attempts clear OTP and force re-request
            if (user.otp.attempts >= 5) {
                user.otp = undefined;
                await user.save();

                return res.status(400).json({ message: "Too many failed attempts. Please request a new code." });
            }

            await user.save()

            return res.status(400).json({ message: "Invalid code, try again" });
        }

        // otp verified successfully, clear it
        user.otp = undefined;
        await user.save()

        // generate a short-lived reset token (15min)
        const resetToken = jwt.sign(
            { userID: user.userID },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ message: "Code verified successfully", resetToken });

    } catch (error) {
        console.log("Error in verify code controller", error.message);
        res.status(500).json({message: "Internal server error"});    
    }
}

// verify resetToken and reset password
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // validate data
        if (!token || !password) {
            return res.status(400).json({ success: false, message: "Token and password are required" });
        }

        // validate password length
        if(password.length < 8) {
            return res.status(400).json({message: "Password must be at least 8 characters"});
        }

        // verify jwt token and get userID
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }
        const { userID } = decoded;

        // find user
        const user = await User.findOne({ userID, isDeleted: { $ne: true } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // hash new password 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // update password and clear otp
        user.password = hashedPassword;
        user.otp = undefined;
        await user.save()

        res.json({ message: "Password updated successfully", reset: true});

    } catch (error) {
        console.log("Error in update password controller", error.message);
        res.status(500).json({message: "Internal server error"});    
    }
}

module.exports =  {
    signup, login, logout, checkAuth,
    verifyEmail, sendCode, verifyCode, resetPassword
}