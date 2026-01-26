import express from "express";
import { verifyToken, verifyAdmin, verifyDriver } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Car from "../models/Car.js";
import Lease from "../models/Lease.js";

const router = express.Router();

// ✅ Get All Leases (Admin)
router.get("/all", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const leases = await Lease.findAll({
            include: [
                { model: User, as: "Driver", attributes: ["firstName", "lastName", "email"] },
                { model: Car, as: "Car", attributes: ["carName"] }
            ]
        });
        res.json(leases);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching all leases" });
    }
});

// ✅ Apply to be a Driver
router.post("/apply-driver", verifyToken, async (req, res) => {
    try {
        const { licenseNumber } = req.body;
        if (!licenseNumber) return res.status(400).json({ error: "License number is required" });

        const user = await User.findByPk(req.user.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        await user.update({ licenseNumber, driverStatus: "pending" });
        res.json({ message: "Driver application submitted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error applying for driver" });
    }
});

// ✅ Get All Driver Applications (Admin)
router.get("/applications", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const drivers = await User.findAll({ where: { driverStatus: "pending" } });
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: "Error fetching applications" });
    }
});

// ✅ Approve/Reject Driver (Admin)
router.post("/approve-driver", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { userId, status } = req.body; // status: 'approved' or 'rejected'
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const updateData = { driverStatus: status };
        if (status === "approved") {
            updateData.role = "driver";
            updateData.notification = "Congratulations! Your driver application has been approved. You now have access to the Driver Dashboard.";
        } else if (status === "rejected") {
            updateData.notification = "We regret to inform you that your driver application has been rejected at this time.";
        }

        await user.update(updateData);
        res.json({ message: `Driver ${status} successfully.` });
    } catch (error) {
        res.status(500).json({ error: "Error updating driver status" });
    }
});

// ✅ Create a Lease (Driver)
router.post("/create", verifyToken, verifyDriver, async (req, res) => {
    try {
        const { carId } = req.body;
        const car = await Car.findByPk(carId);

        if (!car) return res.status(404).json({ error: "Car not found" });
        if (!car.isAvailableForLease) return res.status(400).json({ error: "Car not available for lease" });

        const startDate = new Date();
        const weeklyCost = car.weeklyLeaseCost;

        const lease = await Lease.create({
            driverId: req.user.userId,
            carId,
            startDate,
            weeklyCost,
            status: "active"
        });

        res.json({ message: "Lease created successfully", lease });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error creating lease" });
    }
});

// ✅ Get My Lease (Driver)
router.get("/my-lease", verifyToken, verifyDriver, async (req, res) => {
    try {
        const lease = await Lease.findOne({
            where: { driverId: req.user.userId, status: "active" },
            include: [{ model: Car, as: "Car" }]
        });
        res.json(lease);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching lease" });
    }
});

// ✅ Approve Lease (Admin)
router.post("/approve-lease", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { leaseId, status } = req.body; // status: 'active' or 'terminated'
        const lease = await Lease.findByPk(leaseId);
        if (!lease) return res.status(404).json({ error: "Lease not found" });

        await lease.update({ status });
        res.json({ message: `Lease ${status} successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error updating lease status" });
    }
});

export default router;
