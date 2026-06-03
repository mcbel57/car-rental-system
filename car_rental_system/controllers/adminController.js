import Car from "../models/Car.js";
import User from "../models/User.js";
import Rental from "../models/Rental.js";
import db from "../config/db.js";
import { Op } from "sequelize";
import multer from "multer";

// ⚙️ Multer Configuration to Store Image as Buffer (for Cars)
const storage = multer.memoryStorage(); 

const upload = multer({ storage });

export const addCar = async (req, res) => {
    try {
        console.log("🔥 Incoming Car Addition Request:", req.body);
        console.log("📷 Incoming Image File:", req.file);

        if (!req.file) {
            return res.status(400).json({ error: "Image is required" });
        }

        const { carName, description, color, vehicleType, hireCost } = req.body;

        if (!carName || !description || !color || !vehicleType || !hireCost) {
            return res.status(400).json({ error: "All fields are required, including the image." });
        }

        const newCar = await Car.create({
            carName,
            description,
            color,
            vehicleType,
            costPerDay: hireCost,
            image: req.file.buffer // ✅ Store image as buffer in DB
        });

        res.status(201).json({ message: "Car added successfully", car: newCar });
    } catch (error) {
        console.error("❌ Car Addition Error:", error);
        res.status(500).json({ error: "Server error, please try again" });
    }
};

// ✅ Fetch all drivers waiting for verification
export const getPendingDrivers = async (req, res) => {
    try {
        const drivers = await User.findAll({
            where: { driverStatus: "pending" },
            attributes: ["id", "firstName", "lastName", "email", "phoneNumber", "idNumber", "licenseNumber", "ocrFlag", "verificationNotes", "createdAt"]
        });
        res.status(200).json(drivers);
    } catch (error) {
        console.error("❌ Error fetching pending drivers:", error);
        res.status(500).json({ error: "Failed to fetch applicants" });
    }
};

// ✅ Approve or Reject a Driver
export const verifyDriver = async (req, res) => {
    try {
        const { userId, status } = req.body; // status: 'approved' or 'rejected'

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.driverStatus = status;
        if (status === "approved") {
            user.role = "driver";
            user.notification = "Your driving license has been verified. You may now access the platform features.";
        } else {
            user.notification = "Your driving license verification was rejected. Please re-upload a clear image.";
        }

        await user.save();
        res.status(200).json({ message: `Driver ${status} successfully`, user });
    } catch (error) {
        console.error("❌ Error verifying driver:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getLicenseEntries = async (req, res) => {
    try {
        const entries = await Rental.findAll({
            where: {
                licenseNumber: { [Op.ne]: null }
            },
            include: [
                {
                    model: User,
                    as: "User",
                    attributes: ["id", "firstName", "lastName", "email", "phoneNumber", "idNumber", "licenseNumber", "ocrFlag", "verificationNotes"]
                }
            ],
            order: [["createdAt", "DESC"]],
            limit: 50
        });

        res.status(200).json(entries);
    } catch (error) {
        console.error("❌ Error fetching license entries:", error);
        res.status(500).json({ error: "Failed to fetch license entries" });
    }
};

export const uploadMiddleware = upload.single("image");

// ✅ Fetch OCR entries for a specific user (from Rentals)
export const getUserOcr = async (req, res) => {
    try {
        const userId = req.params.userId;
        const db = await import('../config/db.js');
        const { Rental, User } = db.default;

        const user = await User.findByPk(userId, {
            attributes: ["id", "licenseNumber", "ocrFlag", "verificationNotes", "firstName", "lastName", "email"]
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const entries = await Rental.findAll({
            where: { userId, ocrText: { [db.default.Sequelize.Op.ne]: null } },
            attributes: ["id", "rentalDate", "rentalDays", "licenseNumber", "ocrText", "createdAt"]
        });

        res.status(200).json({ user, entries });
    } catch (error) {
        console.error('❌ Error fetching OCR entries:', error);
        res.status(500).json({ error: 'Failed to fetch OCR entries' });
    }
};

// ✅ Admin review of OCR: set ocrFlag and verificationNotes on User
export const reviewOcr = async (req, res) => {
    try {
        const { userId, ocrFlag, notes } = req.body; // ocrFlag: 'Legitimate' | 'Suspicious' | 'Not Found'
        if (!userId || !ocrFlag) return res.status(400).json({ error: 'userId and ocrFlag required' });

        const db = await import('../config/db.js');
        const { User } = db.default;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.ocrFlag = ocrFlag;
        if (notes) user.verificationNotes = notes;
        await user.save();

        res.status(200).json({ message: 'OCR review saved', user });
    } catch (error) {
        console.error('❌ Error saving OCR review:', error);
        res.status(500).json({ error: 'Failed to save OCR review' });
    }
};
