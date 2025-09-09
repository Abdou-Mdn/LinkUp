require("dotenv").config();
const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const generateToken = require("../lib/utils");
const transporter = require("../lib/nodemailer");
const jwt = require("jsonwebtoken")

const htmlTemplate = (username, otp) => (
    `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://res.cloudinary.com/djc2sdtw2/image/upload/v1757360163/messages/lrpy8l0dz2odlenh7wvs.png" width="100" height="100" alt="Logo" />

            </div>

            <h2 style="font-size: 24px; color: #333; text-align: center;">Password Reset Request</h2>

            <p style="font-size: 14px; color: #555;">Hi <b>${username}</b>,</p>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
                We have received a request to reset your password. Please use the verification code below to complete the process.
            </p>

            <div style="text-align: center; margin: 20px 0;">
                <span style="display: inline-block; background: #f4f4f4; padding: 15px 25px; font-size: 32px; font-weight: bold; letter-spacing: 4px; border-radius: 6px; color: #111;">
                    ${otp}
                </span>
            </div>

            <p style="font-size: 13px; color: #666; text-align: center;">
                Expires in <b>10 minutes</b>
            </p>

            <p style="font-size: 13px; color: #555; line-height: 1.6;">
                Didn't make this request? Don't worry — your account is still secure and can only be accessed using this code.    
            </p>

            <p style="font-size: 13px; color: #555; line-height: 1.6;">
                If you didn't request this code, simply ignore this email.  
            </p>

            <p style="font-size: 11px; color: #999; text-align: center; margin-top: 30px;">
                &copy; ${new Date().getFullYear()}. All rights reserved. LinkUp
            </p>
        </div>
    `
)

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
            res.status(201).json({ user: userWithoutPassword });
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

        const { password: _, ...userWithoutPassword } = user.toObject();
        generateToken(user.userID,res);

        res.status(200).json({ user: userWithoutPassword });

    } catch (error) {
        console.error("Error in login contoller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const logout = async (req,res) => {
    try {
        const userID = req.user.userID;

        const user = await User.findOne({userID});

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // updating lastSeen
        user.lastSeen = new Date();
        await user.save();

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

const verifyEmail = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({email, isDeleted: { $ne: true }});
        
        if (!user) {
            return res.status(404).json({ message: "Email not registered" });
        }

        res.json({ message: "Email verified", userID: user.userID });
    } catch (error) {
        console.log("Error in verify email controller", error.message);
        res.status(500).json({"message": "Internal server error"});
    }
}

const sendCode = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email, isDeleted: { $ne: true } });

        if (!user) {
            return res.status(404).json({ message: "Email not registered" });
        }

        if (user.otp && (user.otp.lastSent > Date.now() - (60 * 1000))) {
            return res.status(429).json({ message: "You can request a new code after 1 minute" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);

        try {
            const info = await transporter.sendMail({
                from: `"LinkUp Team" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Password Reset Code",
                html: htmlTemplate(user.name, otp),
                text: `Hi ${user.name},
                        We have received a request to reset your password.
                        Here is your verification code: ${otp}
                        (It expires in 10 minutes)

                        If you didn't request this, just ignore the message.

                        © ${new Date().getFullYear()} LinkUp Team.`
            });
            
            user.otp = {
                code : hashedOTP,
                expires: new Date(Date.now() + 10 * 60 * 1000),
                lastSent: new Date() 
            }

            await user.save();

            res.json({ message: "Code sent to your email", emailID: info.messageId });   
        } catch (err) {
            console.error("Email send failed:", err.message);
            res.status(500).json({ message: "Failed to send email. Try again later." });
        }
    
    } catch (error) {
        console.log("Error in send code controller", error.message);
        res.status(500).json({"message": "Internal server error"});    
    }
}

const verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ email, isDeleted: { $ne: true } });

        if (!user) {
            return res.status(404).json({ message: "Email not registered" });
        }

        if (!user.otp || !user.otp.code) {
            return res.status(400).json({ message: "No code found. Please request a new one." });
        }

        if (user.otp.expires < Date.now()) {
            return res.status(400).json({ message: "Code has expired. Please request a new one." });
        }

        const isMatch = await bcrypt.compare(code, user.otp.code);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid code" });
        }

        user.otp = undefined;
        await user.save()

        const resetToken = jwt.sign(
            { email: user.email, userID: user.userID },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ message: "Code verified successfully", resetToken });

    } catch (error) {
        console.log("Error in verify code controller", error.message);
        res.status(500).json({"message": "Internal server error"});    
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const email = decoded.email;
        const userID = decoded.userID;

        const user = await User.findOne({ userID, email, isDeleted: { $ne: true } });

        if (!user) {
            return res.status(404).json({ message: "Email not registered" });
        }

        if(password.length < 8) {
            return res.status(400).json({"message": "Password must be at least 8 characters"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.otp = undefined;

        await user.save()

        res.json({ message: "Password updated successfully", reset: true});

    } catch (error) {
        console.log("Error in update password controller", error.message);
        res.status(500).json({"message": "Internal server error"});    
    }
}

module.exports =  {
    signup, login, logout, checkAuth,
    verifyEmail, sendCode, verifyCode, resetPassword
}