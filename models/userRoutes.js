const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sendOTPEmail = require("../utils/email");

/* ================= CREATE USER WITH OTP ================= */
router.post("/add", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Check username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      if (!existingUsername.isVerified && existingUsername.email === email) {
         // Same user trying again, we will handle this below
      } else {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Check email
    const existingEmail = await User.findOne({ email });
    let isResend = false;
    let userToSave = existingEmail;

    if (existingEmail) {
      if (existingEmail.isVerified) {
        return res.status(400).json({ message: "Email already exists" });
      } else {
        isResend = true;
      }
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 min

    if (!isResend) {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      userToSave = new User({
        username,
        email,
        password: hashedPassword,
        role,
        otp,
        otpExpires,
        isVerified: false,
      });
    } else {
      userToSave.otp = otp;
      userToSave.otpExpires = otpExpires;
      // Optionally update password if they changed it
      const hashedPassword = await bcrypt.hash(password, 10);
      userToSave.password = hashedPassword;
      userToSave.username = username;
      userToSave.role = role;
    }

    // Send email first, so if it fails we don't save a broken user
    try {
      await sendOTPEmail(email, otp);
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      return res.status(500).json({ message: "Failed to send OTP email. Please check the email address." });
    }

    await userToSave.save();

    res.json({ 
      success: true,
      message: isResend ? "OTP resent to existing unverified user." : "User created! (Verification email sent)" 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* ================= RESEND OTP ================= */
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 min

    try {
      await sendOTPEmail(email, otp);
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      return res.status(500).json({ message: "Failed to send OTP email." });
    }

    await user.save();

    res.json({ message: "New OTP sent successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= VERIFY OTP ================= */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    res.json({ message: "User verified successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Account not verified. Please verify OTP." });
    }

    res.json({
      username: user.username,
      role: user.role,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET USERS ================= */
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DELETE USER ================= */
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE USER ================= */
router.put("/:id", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;