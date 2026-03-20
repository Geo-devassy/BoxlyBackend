const axios = require("axios");

const sendOTPEmail = async (email, otp) => {
  try {
    const data = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY, // ADDED: Private key for Strict Mode
      template_params: {
        to_email: email, // If you added a variable {{to_email}}
        otp_code: otp,   // If you added a variable {{otp_code}}
        message: `Your Boxly OTP is: ${otp}. It expires in 5 minutes.` // If you log standard {{message}}
      }
    };

    const response = await axios.post(
      "https://api.emailjs.com/api/v1.0/email/send",
      data,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("EMAILJS SENT:", response.data);
    return response.data;
  } catch (err) {
    console.error("EMAILJS ERROR:", err.response?.data || err.message);
    throw err; // Re-throw to inform the caller
  }
};

module.exports = sendOTPEmail;