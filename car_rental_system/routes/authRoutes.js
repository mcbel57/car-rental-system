import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import PasswordResetToken from "../models/PasswordResetToken.js";
import { registerUser, loginUser, getUserProfile } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js"; // Middleware to protect routes
import User from "../models/User.js"; 
import upload from "../middleware/upload.js";

const router = express.Router();

// ✅ User Registration Route
router.post("/register", upload.single("licensePhoto"), registerUser);

// ✅ User Login Route
router.post("/login", loginUser);

// ✅ Get User Profile (Protected Route)
router.get("/profile", verifyToken, getUserProfile);

router.get("/dashboard", verifyToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            attributes: ["id", "firstName", "lastName", "email", "role"],
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ 
            userId: user.id, 
            firstName: user.firstName, 
            lastName: user.lastName, 
            email: user.email, 
            role: user.role 
        });

    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Forgot password request: send reset email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Respond same message to avoid user enumeration
      return res.json({ message: "If that email exists, a reset link was sent." });
    }
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await PasswordResetToken.upsert({ userId: user.id, tokenHash, expiresAt });
    const resetLink = `${process.env.FRONTEND_URL}/reset_password.html?token=${rawToken}&email=${encodeURIComponent(email)}`;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: '"Car Rental" <no-reply@carrental.com>',
      to: email,
      subject: "Password reset for your Car Rental account",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. The link expires in 1 hour.</p>`,
    });
    return res.json({ message: "If that email exists, a reset link was sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Reset password endpoint
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid request" });
    const record = await PasswordResetToken.findOne({ where: { userId: user.id } });
    if (!record || new Date() > record.expiresAt) return res.status(400).json({ error: "Token expired or not found" });
    const valid = await bcrypt.compare(token, record.tokenHash);
    if (!valid) return res.status(400).json({ error: "Invalid token" });
    const newHash = await bcrypt.hash(newPassword, 12);
    await user.update({ password: newHash });
    await PasswordResetToken.destroy({ where: { userId: user.id } });
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
