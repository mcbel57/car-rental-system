import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js"; // Ensure file extension is included
import multer from "multer";
import { addCar, uploadMiddleware } from "../controllers/adminController.js";

const router = express.Router();

// Multer Setup for Image Uploads
const storage = multer.memoryStorage(); // Stores image as Buffer
const upload = multer({ storage: storage });


// ✅ Ensure Multer Middleware is Applied
router.post("/add-car", uploadMiddleware, addCar);


// Admin: Get All Users
router.get("/users", verifyToken, async (req, res) => {
    const users = await User.findAll();
    res.json(users);
});

// Admin: Delete User
router.delete("/users/:id", verifyToken, async (req, res) => {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: "User deleted successfully" });
});

export default router; // ✅ Use ES module export
