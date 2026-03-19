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
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      otp,
      otpExpires: Date.now() + 5 * 60 * 1000, // 5 min
      isVerified: false,
    });

    await newUser.save();

    // Fire and forget email - don't let email failure block user creation
    sendOTPEmail(email, otp).catch(err => {
      console.error("Delayed email error (logged only):", err);
    });

    res.json({ 
      success: true,
      message: "User created! (Verification email attempted)" 
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

    await user.save();

    // Fire and forget email
    sendOTPEmail(email, otp).catch(err => {
      console.error("Delayed email error (logged only):", err);
    });

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