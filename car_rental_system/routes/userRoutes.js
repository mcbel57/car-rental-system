import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js"; // Import your User model
import { verifyToken } from "../middleware/authMiddleware.js"; // Auth middleware

dotenv.config();

const router = express.Router();

// 🔹 User Registration Route
router.post("/register", async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, idNumber, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            phoneNumber,
            idNumber,
            password: hashedPassword,
        });

        // Generate JWT token
        const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({ message: "User registered successfully", token });
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

// 🔹 User Login Route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

// 🔹 Get User Profile (Protected Route)
router.get("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, { attributes: { exclude: ["password"] } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

export default router;

