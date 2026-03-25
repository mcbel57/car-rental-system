import express from "express";
import db from "../config/db.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
const { Car, User, Rental, Lease } = db;

// ✅ GET global statistics for admin
router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [totalCars, activeLeases, pendingDrivers, activeRentals] = await Promise.all([
            Car.count(),
            Lease.count({ where: { status: "active" } }),
            Lease.count({ where: { status: "pending" } }),
            Rental.count({ where: { status: "active" } })
        ]);

        res.json({
            totalCars,
            activeLeases,
            pendingDrivers,
            activeRentals
        });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

export default router;
