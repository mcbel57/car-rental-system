import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import db from "../config/db.js"; // ✅ Import db object
import { getUserBookings, cancelBooking } from "../controllers/bookingController.js"; // ✅ Ensure correct import

const { Car, User, Rental } = db; // ✅ Extract models

const router = express.Router();

// 🚀 Create a Booking (with Car Details Fetching & User Authentication)
router.post("/", verifyToken, async (req, res) => {
    try {
        const { carId, rentalDate, rentalDays, depositPaid, paymentStatus } = req.body;
        const userId = req.user.userId;

        // 🛑 Validate required fields
        if (!carId || !userId || !rentalDate || !rentalDays) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (rentalDays < 1 || rentalDays > 30) {
            return res.status(400).json({ success: false, message: "Rental days must be between 1 and 30." });
        }

        // 🛑 Check for past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bookingDate = new Date(rentalDate);
        if (bookingDate < today) {
            return res.status(400).json({ success: false, message: "Booking date cannot be in the past." });
        }

        // 🔍 Fetch car details
        const car = await Car.findOne({
            where: { id: carId },
            attributes: ["carName", "costPerDay"]
        });

        if (!car) {
            return res.status(404).json({ success: false, message: "Car not found" });
        }

        // 🔍 Fetch user details
        const user = await User.findOne({
            where: { id: userId },
            attributes: ["firstName", "lastName", "idNumber"]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const fullName = `${user.firstName} ${user.lastName}`;
        const idNumber = user.idNumber;
        const totalCost = car.costPerDay * rentalDays;

        // ✅ Create Booking
        const rental = await Rental.create({
            carId,
            userId,
            carName: car.carName,
            fullName,
            idNumber,
            rentalDate,
            rentalDays,
            cost: totalCost,
            depositPaid,
            paymentStatus: paymentStatus || 'pending',
            status: "active",
        });

        res.status(201).json({ success: true, message: "Car booked successfully!", rentalId: rental.id });

    } catch (error) {
        console.error("❌ Booking Error:", error);
        res.status(500).json({ success: false, message: "Error booking car", error: error.message });
    }
});

// 📌 Fetch Bookings for Logged-in User
router.get("/:userId", verifyToken, getUserBookings);

// 🗑️ Cancel Booking
router.delete("/:id", verifyToken, cancelBooking);

export default router;
