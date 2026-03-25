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
                { model: Car, as: "Car", attributes: ["carName"] },
                { model: User, as: "User", attributes: ["firstName", "lastName", "email"] }
            ]
        });

        const formattedRentals = rentals.map(r => ({
            id: r.id,
            carName: r.Car ? r.Car.carName : r.carName,
            fullName: r.User ? `${r.User.firstName} ${r.User.lastName}` : r.fullName,
            email: r.User ? r.User.email : "",
            idNumber: r.idNumber,
            rentalDate: r.rentalDate,
            rentalDays: r.rentalDays,
            cost: r.cost
        }));

        res.json(formattedRentals);
    } catch (error) {
        console.error("❌ Admin Rentals Fetch Error:", error);
        res.status(500).json({ error: "Error fetching rental history: " + error.message });
    }
});

// ✅ Get all rentals for general admin use (backward compatibility)
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const rentals = await Rental.findAll();
        res.json(rentals);
    } catch (error) {
        console.error("❌ Error fetching rentals:", error);
        res.status(500).json({ success: false, message: "Error fetching rentals." });
    }
});

// ✅ Cancel rental
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const rental = await Rental.findByPk(id);
        if (!rental) return res.status(404).json({ success: false, message: "Rental not found." });

        await rental.destroy();
        res.json({ success: true, message: "Rental canceled successfully." });
    } catch (error) {
        console.error("❌ Error canceling rental:", error);
        res.status(500).json({ success: false, message: "Error canceling rental." });
    }
});

export default router;

