import Car from "../models/Car.js";
import multer from "multer";

// ⚙️ Multer Configuration to Store Image as Buffer
const storage = multer.memoryStorage(); // 🔥 Store image in memory as buffer

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

export const uploadMiddleware = upload.single("image");
