import Car from "../models/Car.js";
import User from "../models/User.js";
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

        const { carName, description, color, vehicleType, hireCost, isAvailableForLease, weeklyLeaseCost } = req.body;

        if (!carName || !description || !color || !vehicleType || !hireCost) {
            return res.status(400).json({ error: "All fields are required, including the image." });
        }

        const newCar = await Car.create({
            carName,
            description,
            color,
            vehicleType,
            costPerDay: hireCost,
            image: req.file.buffer, // ✅ Store image as buffer in DB
            isAvailableForLease: isAvailableForLease === 'true' || isAvailableForLease === 'on' || isAvailableForLease === true,
            weeklyLeaseCost: weeklyLeaseCost ? parseFloat(weeklyLeaseCost) : null
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
            attributes: ["id", "firstName", "lastName", "email", "idNumber", "licenseNumber", "licensePhoto", "ocrFlag", "verificationNotes", "createdAt"]
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
            user.notification = "Your driving license has been verified! You can now start leasing cars.";
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

export const uploadMiddleware = upload.single("image");
