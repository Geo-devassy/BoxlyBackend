const nodemailer = require("nodemailer");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.sendgrid.net",
  port: process.env.SMTP_PORT || 2525, // Render allows port 2525
  secure: false, // false for port 2525, true for 465
  auth: {
    user: process.env.EMAIL_USER, // E.g. 'apikey' for SendGrid
    pass: process.env.EMAIL_PASS, // Your SendGrid/Brevo API key
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000, 
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