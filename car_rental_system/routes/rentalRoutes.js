import express from "express";
import { Op } from "sequelize";
import { verifyToken, verifyAdminToken, verifyAdmin, verifyCustomer } from "../middleware/authMiddleware.js";
import Rental from "../models/Rental.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import rentalController from "../controllers/rentalController.js"; // ✅ Named import



const router = express.Router();

// ✅ Create a new rental
router.post("/", verifyToken, verifyCustomer, async (req, res) => {
    try {
        const { carId, rentalDate, rentalDays, cost } = req.body;
        const userId = req.user.userId;

        if (!carId || !rentalDate || !rentalDays || !cost) {
            return res.status(400).json({ error: "carId, rentalDate, rentalDays, and cost are required." });
        }

        const parsedRentalDays = parseInt(rentalDays, 10);
        if (isNaN(parsedRentalDays) || parsedRentalDays < 1 || parsedRentalDays > 30) {
            return res.status(400).json({ error: "rentalDays must be a number between 1 and 30." });
        }

        const bookingDate = new Date(rentalDate);
        if (Number.isNaN(bookingDate.getTime())) {
            return res.status(400).json({ error: "Invalid rentalDate format." });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (bookingDate < today) {
            return res.status(400).json({ error: "Rental date cannot be in the past." });
        }

        const requestedEnd = new Date(rentalDate);
        requestedEnd.setDate(requestedEnd.getDate() + parsedRentalDays - 1);
        const requestedEndDateString = requestedEnd.toISOString().split("T")[0];

        const existingRentals = await Rental.findAll({
            where: {
                carId,
                status: { [Op.not]: "cancelled" },
                rentalDate: { [Op.lte]: requestedEndDateString }
            }
        });

        for (const existingRental of existingRentals) {
            const existingStart = new Date(existingRental.rentalDate);
            const existingEnd = new Date(existingRental.rentalDate);
            existingEnd.setDate(existingEnd.getDate() + existingRental.rentalDays - 1);

            if (existingEnd >= bookingDate && existingStart <= requestedEnd) {
                return res.status(409).json({ error: "This car is already booked for the selected dates." });
            }
        }

        const car = await Car.findByPk(carId);
        if (!car) {
            return res.status(404).json({ error: "Car not found." });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const fullName = `${user.firstName} ${user.lastName}`;
        const idNumber = user.idNumber;

        const newRental = await Rental.create({
            userId,
            carId,
            carName: car.carName,
            fullName,
            idNumber,
            rentalDate,
            rentalDays: parsedRentalDays,
            cost: parseFloat(cost),
            status: "active",
            paymentStatus: "pending"
        });

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
        const rentals = await Rental.findAll({
            include: [
                { model: Car, as: "Car", attributes: ["carName", "costPerDay"] }
            ]
        });

        // ✅ Map to use current car data
        const formattedRentals = rentals.map(r => ({
            ...r.toJSON(),
            carName: r.Car ? r.Car.carName : r.carName
        }));

        res.json(formattedRentals);
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

