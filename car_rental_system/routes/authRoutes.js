import express from "express";
import { registerUser, loginUser, getUserProfile } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js"; // Middleware to protect routes
import User from "../models/User.js"; 

const router = express.Router();

// ✅ User Registration Route
router.post("/register", registerUser);

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

export default router;
