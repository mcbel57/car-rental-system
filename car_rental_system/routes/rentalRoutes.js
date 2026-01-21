import express from "express";
import { verifyToken, verifyAdminToken, verifyAdmin } from "../middleware/authMiddleware.js";
import Rental from "../models/Rental.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import rentalController from "../controllers/rentalController.js"; // ✅ Named import
import db from "../config/db.js";  // ✅ Import database connection



const router = express.Router();

// ✅ Create a new rental
router.post("/", verifyToken, async (req, res) => {
    try {
        const { carId, startDate, endDate, totalCost } = req.body;
        const userId = req.user.id;

        const newRental = await Rental.create({ userId, carId, startDate, endDate, totalCost });
        res.status(201).json({ message: "Rental created successfully", rental: newRental });
    } catch (error) {
        res.status(500).json({ error: "Error creating rental: " + error.message });
    }
});

// ✅ Get user rental history
router.get("/user", verifyToken, async (req, res) => {
    try {
        const rentals = await Rental.findAll({
            where: { userId: req.user.id },
            include: [{ model: Car, attributes: ["name", "imageUrl"] }]
        });

        res.json(rentals);
    } catch (error) {
        res.status(500).json({ error: "Error fetching rental history: " + error.message });
    }
});

// ✅ Get all rentals (Admin only)
router.get("/admin", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const rentals = await Rental.findAll({
            include: [
                { model: Car, attributes: ["name", "imageUrl"] },
                { model: User, attributes: ["firstName", "lastName", "email"] }
            ]
        });

        res.json(rentals);
    } catch (error) {
        res.status(500).json({ error: "Error fetching rental history: " + error.message });
    }
});

// ✅ Cancel rental
router.put("/:id/cancel", verifyToken, async (req, res) => {
    try {
        await Rental.update({ status: "Canceled" }, { where: { id: req.params.id, userId: req.user.id } });
        res.json({ message: "Rental canceled successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error canceling rental: " + error.message });
    }
});

// 📌 Get All Rentals (Admin Only)
router.get("/", async (req, res) => {
    try {
        const rentals = await db.Rental.findAll();
        res.json(rentals);
    } catch (error) {
        console.error("❌ Error fetching rentals:", error);
        res.status(500).json({ success: false, message: "Error fetching rentals." });
    }
});

// 📌 Cancel Rental (Admin Only)
router.delete("/:id",  async (req, res) => {
    try {
        const { id } = req.params;
        const rental = await db.Rental.findByPk(id);
        if (!rental) return res.status(404).json({ success: false, message: "Rental not found." });

        await rental.destroy();
        res.json({ success: true, message: "Rental canceled successfully." });
    } catch (error) {
        console.error("❌ Error canceling rental:", error);
        res.status(500).json({ success: false, message: "Error canceling rental." });
    }
});

// ✅ Fetch all rentals
router.get("/", rentalController.getAllRentals);

// ✅ Delete a rental by ID
router.delete("/:id", rentalController.deleteRental);

// ✅ Use ES6 Export
export default router;

