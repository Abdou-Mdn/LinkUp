require("dotenv").config();
const axios = require("axios");

const EMAIL_USER = process.env.EMAIL_USER; 
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

/* general template for the emails sent when requesting the otp code to reset password */
const otpTemplate = (username, otp) => (
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
);

const sendEmail = async ( receiver, username, otp ) => {
    try {
        const response = await axios.post(
            BREVO_URL,
            {
                sender: {
                    name: "LinkUp Team",
                    email: EMAIL_USER
                },

                to: [
                    {
                        email: receiver
                    }
                ],

                subject: "Password Reset Code",
                
                htmlContent: otpTemplate(username, otp)
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "api-key": BREVO_API_KEY 
                }
            }
        );
        console.log("Email sent:", response.data);
        return response.data;

    } catch (error) {
        console.error("Error sending email:", error.response?.data || error.message);
    }
}

module.exports = { otpTemplate, sendEmail }