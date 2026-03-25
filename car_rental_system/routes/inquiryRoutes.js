import express from "express";
import db from "../config/db.js";

const router = express.Router();
const { Inquiry } = db;

// ✅ POST a new inquiry
router.post("/", async (req, res) => {
    try {
        const { fullName, email, message } = req.body;
        if (!fullName || !email || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const inquiry = await Inquiry.create({ fullName, email, message });
        res.status(201).json({ message: "Inquiry received successfully", inquiry });
    } catch (error) {
        console.error("❌ Inquiry Error:", error);
        res.status(500).json({ error: "Failed to process inquiry", details: error.message });
    }
});

// ✅ GET all inquiries (Admin only)
router.get("/", async (req, res) => {
    try {
        const inquiries = await Inquiry.findAll({ order: [['createdAt', 'DESC']] });
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch inquiries" });
    }
});

export default router;
