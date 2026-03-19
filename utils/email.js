const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
});

const sendOTPEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"Boxly Warehouse" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Boxly OTP Verification",
      html: `
        <h2>Welcome to Boxly</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      `,
    });

    console.log("EMAIL SENT:", info.response);
    return info;
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    throw err; // Re-throw so the route knows it failed
  }
};

module.exports = sendOTPEmail;