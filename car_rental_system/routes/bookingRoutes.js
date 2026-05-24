import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import db from "../config/db.js";
import { getUserBookings, cancelBooking } from "../controllers/bookingController.js";
import upload from "../middleware/upload.js";

const { Car, User, Rental, Sequelize } = db;
const { Op } = Sequelize;

const router = express.Router();

// 🚀 Create a Booking (with Car Details Fetching & User Authentication)
// upload.single('licensePhoto') parses the multipart/form-data body AND handles the optional ID photo upload
router.post("/", verifyToken, upload.single("licensePhoto"), async (req, res) => {
    try {
        // FormData sends everything as strings — coerce to correct types
        const carId = parseInt(req.body.carId);
        const rentalDate = req.body.rentalDate;
        const rentalDays = parseInt(req.body.rentalDays);
        const paymentStatus = req.body.paymentStatus;
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

        // 📅 Calculate the end date of the requested rental period
        const requestedStart = new Date(rentalDate);
        const requestedEnd = new Date(rentalDate);
        requestedEnd.setDate(requestedEnd.getDate() + rentalDays - 1);

        // 🛑 Check for date conflicts — any existing non-cancelled rental that overlaps
        const existingRentals = await Rental.findAll({
            where: {
                carId,
                status: { [Op.not]: "cancelled" },
                rentalDate: { [Op.lte]: requestedEnd.toISOString().split("T")[0] }
            }
        });

        for (const existingRental of existingRentals) {
            const existingStart = new Date(existingRental.rentalDate);
            const existingEnd = new Date(existingRental.rentalDate);
            existingEnd.setDate(existingEnd.getDate() + existingRental.rentalDays - 1);

            if (existingEnd >= requestedStart && existingStart <= requestedEnd) {
                return res.status(409).json({
                    success: false,
                    message: `This vehicle is already booked from ${existingRental.rentalDate} for ${existingRental.rentalDays} day(s). Please choose different dates.`
                });
            }
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

        // 🚗 Delivery Option — Ksh 1,000 flat fee for home/office delivery
        const deliveryOption = req.body.deliveryOption === "delivery" ? "delivery" : "pickup";
        const deliveryAddress = deliveryOption === "delivery" ? (req.body.deliveryAddress || "") : null;
        const DELIVERY_FEE = 1000;

        let totalCost = car.costPerDay * rentalDays;
        if (deliveryOption === "delivery") {
            totalCost += DELIVERY_FEE;
        }

        // Calculate deposit server-side — 50% of total (includes delivery fee if applicable)
        const depositPaid = totalCost * 0.5;

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
            deliveryOption,
            deliveryAddress,
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
