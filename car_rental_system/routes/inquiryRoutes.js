import express from "express";
import db from "../config/db.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

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
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const inquiries = await Inquiry.findAll({ order: [['createdAt', 'DESC']] });
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch inquiries" });
    }
});

// ✅ PATCH inquiry status to read
router.patch("/:id/read", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const inquiryId = req.params.id;
        const inquiry = await Inquiry.findByPk(inquiryId);

        if (!inquiry) {
            return res.status(404).json({ error: "Inquiry not found" });
        }

        await inquiry.update({ status: 'read' });
        res.json({ message: "Inquiry marked as read", inquiry });
    } catch (error) {
        console.error("❌ Inquiry update error:", error);
        res.status(500).json({ error: "Failed to update inquiry status" });
    }
});

// ✅ POST alias for read marking, in case PATCH is blocked by intermediary agents
router.post("/:id/read", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const inquiryId = req.params.id;
        const inquiry = await Inquiry.findByPk(inquiryId);

        if (!inquiry) {
            return res.status(404).json({ error: "Inquiry not found" });
        }

        await inquiry.update({ status: 'read' });
        res.json({ message: "Inquiry marked as read", inquiry });
    } catch (error) {
        console.error("❌ Inquiry update error:", error);
        res.status(500).json({ error: "Failed to update inquiry status" });
    }
});

export default router;
