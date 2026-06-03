import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import db from "../config/db.js";
import { getUserBookings, cancelBooking, getRentalHistory, completeRental } from "../controllers/bookingController.js";
import upload from "../middleware/upload.js";
import Tesseract from "tesseract.js";
import fs from "fs";

const { Car, User, Rental, Sequelize } = db;
const { Op } = Sequelize;

const LICENSE_KEYWORDS = [
    "driver",
    "driving licence",
    "driving license",
    "driver's licence",
    "driver's license",
    "license number",
    "licence number",
    "dl no",
    "dl number",
    "license no",
    "driver license",
    "driving licence number"
];

const normalizeText = (text) => text.replace(/\s+/g, " ").trim().toLowerCase();

const isValidDriverLicense = (text) => {
    const normalized = normalizeText(text);
    return LICENSE_KEYWORDS.some(keyword => normalized.includes(keyword));
};

const runLicenseOcr = async (filePath) => {
    const { data: { text } } = await Tesseract.recognize(filePath, "eng");
    return text || "";
};

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

        // 🛑 Check for date conflicts — only with ACTIVE (confirmed) rentals
        const existingRentals = await Rental.findAll({
            where: {
                carId,
                status: "active",  // ✅ Only check confirmed bookings
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
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Upload a valid driver's license image to continue." });
        }

        let ocrText = "";
        try {
            ocrText = await runLicenseOcr(req.file.path);
            console.log("🧠 OCR result:", ocrText.slice(0, 250));
        } catch (ocrError) {
            console.error("❌ OCR error:", ocrError);
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: "Unable to verify the uploaded image. Please upload a clear driver's license." });
        }

        if (!isValidDriverLicense(ocrText)) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: "Please upload a clear driver's license photo. The image must contain a real license document."
            });
        }

        // --- Parse useful fields from OCR text ---
        let licenseNumber = null;
        try {
            // Look for explicit labels first (license, licence, dl no, etc.)
            const labelMatch = ocrText.match(/(?:license|licence|dl|dl no|dl number|license no|licence no|license number|licence number)[:\s]*([A-Z0-9\-\/\s]{4,30})/i);
            if (labelMatch && labelMatch[1]) {
                licenseNumber = labelMatch[1].trim();
            } else {
                // Fallback: first numeric sequence of length >=5
                const numMatch = ocrText.match(/\d{5,}/);
                if (numMatch) licenseNumber = numMatch[0];
            }
        } catch (parseErr) {
            console.warn('OCR parse warning:', parseErr);
        }

        const deliveryOption = req.body.deliveryOption === "delivery" ? "delivery" : "pickup";
        const deliveryAddress = deliveryOption === "delivery" ? (req.body.deliveryAddress || "") : null;
        const DELIVERY_FEE = 1000;

        let totalCost = car.costPerDay * rentalDays;
        if (deliveryOption === "delivery") {
            totalCost += DELIVERY_FEE;
        }

        // Calculate deposit server-side — 50% of total (includes delivery fee if applicable)
        const depositPaid = totalCost * 0.5;

        // ✅ Create Booking with PENDING status until payment confirmed
        const rental = await Rental.create({
            carId,
            userId,
            carName: car.carName,
            fullName,
            idNumber,
            licenseNumber,
            ocrText,
            rentalDate,
            rentalDays,
            cost: totalCost,
            depositPaid,
            paymentStatus: paymentStatus || 'pending',
            status: "pending",  // ✅ CHANGED: Start as pending, only activate after payment confirmed
            deliveryOption,
            deliveryAddress,
        });

        // If user profile doesn't have a licenseNumber, update it with parsed value
        try {
            if (licenseNumber && !user.licenseNumber) {
                await User.update({ licenseNumber }, { where: { id: userId } });
            }
        } catch (uErr) {
            console.warn('Failed to update user license fields:', uErr.message || uErr);
        }
        res.status(201).json({ success: true, message: "Car booked successfully!", rentalId: rental.id });

    } catch (error) {
        console.error("❌ Booking Error:", error);
        res.status(500).json({ success: false, message: "Error booking car", error: error.message });
    }
});

// 📋 Fetch Rental History (Completed & Cancelled) — MUST be before /:userId
router.get("/:userId/history", verifyToken, getRentalHistory);

// 📌 Fetch Bookings for Logged-in User
router.get("/:userId", verifyToken, getUserBookings);

// ✅ Complete Rental (Mark as completed when returned)
router.post("/:id/complete", verifyToken, completeRental);

// 🗑️ Cancel Booking (Marks as cancelled, calculates refund)
router.delete("/:id", verifyToken, cancelBooking);

export default router;
