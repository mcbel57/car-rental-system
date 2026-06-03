import express from "express";
import db from "../config/db.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import { getPendingDrivers, verifyDriver, getUserOcr, reviewOcr, getLicenseEntries } from "../controllers/adminController.js";

const router = express.Router();
const { Car, User, Rental } = db;

// ✅ Verification Routes
router.get("/pending-drivers", verifyToken, verifyAdmin, getPendingDrivers);
router.post("/verify-driver", verifyToken, verifyAdmin, verifyDriver);
router.get("/license-entries", verifyToken, verifyAdmin, getLicenseEntries);
// OCR review endpoints
router.get("/ocr/:userId", verifyToken, verifyAdmin, getUserOcr);
router.post("/ocr-review", verifyToken, verifyAdmin, reviewOcr);

// ✅ Get All Customers (Admin)
router.get("/customers", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const customers = await User.findAll({
            where: { role: "customer" },
            attributes: ["id", "firstName", "lastName", "email", "idNumber", "phoneNumber", "role", "createdAt"]
        });
        res.json(customers);
    } catch (error) {
        console.error("❌ Error fetching customers:", error);
        res.status(500).json({ error: "Failed to fetch customers" });
    }
});

// ✅ Get All Approved Drivers (Admin)
router.get("/drivers", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const drivers = await User.findAll({
            where: { role: "driver" },
            attributes: ["id", "firstName", "lastName", "email", "idNumber", "phoneNumber", "licenseNumber", "role", "createdAt"]
        });
        res.json(drivers);
    } catch (error) {
        console.error("❌ Error fetching drivers:", error);
        res.status(500).json({ error: "Failed to fetch drivers" });
    }
});

// ✅ GET global statistics for admin
router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [totalCars, activeRentals] = await Promise.all([
            Car.count(),
            Rental.count({ where: { status: "active" } })
        ]);

        res.json({
            totalCars,
            activeRentals
        });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

export default router;
