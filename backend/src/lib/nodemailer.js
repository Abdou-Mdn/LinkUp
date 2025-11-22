require("dotenv").config();
const nodemailer = require("nodemailer");


/* 
    Nodemailer Configuration

  this file sets up a Nodemailer transporter for sending emails.
  it uses Gmail as the email service with credentials stored in environment variables.
*/
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) console.log("SMTP failed:", err.message);
  else console.log("SMTP ready!");
});

module.exports = transporter;

