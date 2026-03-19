require("dotenv").config();
const sendOTPEmail = require("./utils/email");

async function testEmail() {
  try {
    console.log("Using email:", process.env.EMAIL_USER);
    await sendOTPEmail("test@example.com", "123456");
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

testEmail();
