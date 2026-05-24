import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import fs from "fs";
import db from "../config/db.js";  // Ensure MySQL connection is imported
import { getAllCars, addCar, deleteCar } from "../controllers/carController.js";

import Car from "../models/Car.js"; // ✅ Ensure file extension is included
import Rental from "../models/Rental.js";

const router = express.Router();

// ✅ Fetch all cars (Admin and User)
router.get("/", getAllCars);

// ✅ Fetch all cars for admin (backward compatibility if needed)
router.get("/admin/cars", getAllCars);

// ✅ Delete a car (Admin Only)
router.delete("/admin/cars/:id", verifyToken, verifyAdmin, deleteCar);
router.delete("/:id", verifyToken, verifyAdmin, deleteCar);


// ✅ Edit Car Details
router.put("/:id", verifyToken, verifyAdmin, upload.single("image"), async (req, res) => {
    try {
        const { carName, description, color, vehicleType, costPerDay } = req.body;
        
        const updateData = {};
        if (carName) updateData.carName = carName;
        if (description) updateData.description = description;
        if (color) updateData.color = color;
        if (vehicleType) updateData.vehicleType = vehicleType;
        
        if (costPerDay !== undefined) {
            const parsedCost = parseFloat(costPerDay);
            if (isNaN(parsedCost)) return res.status(400).json({ error: "Invalid cost value" });
            updateData.costPerDay = parsedCost;
        }

        if (req.file) {
            updateData.image = fs.readFileSync(req.file.path);
            fs.unlinkSync(req.file.path);
        }

        await Car.update(updateData, { where: { id: req.params.id } });

        res.json({ success: true, message: "Car updated successfully" });
    } catch (error) {
        console.error("❌ Error updating car:", error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: "Error updating car: " + error.message });
    }
});

// ✅ Add a New Car (Admin Only)
router.post("/", verifyToken, verifyAdmin, upload.single("image"), async (req, res) => {
    try {
        const { carName, description, color, vehicleType, hireCost } = req.body;
        
        const parsedCost = parseFloat(hireCost);
        if (isNaN(parsedCost)) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: "Invalid daily rental cost" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Vehicle image is required" });
        }

        // Read image from disk into buffer for BLOB storage
        const image = fs.readFileSync(req.file.path);

        const newCar = await Car.create({
            carName,
            description,
            color,
            vehicleType,
            costPerDay: parsedCost,
            image
        });

        // Clean up the uploaded file from disk
        fs.unlinkSync(req.file.path);

        res.status(201).json({ success: true, message: "Car added successfully", car: newCar });
    } catch (error) {
        console.error("❌ Error adding car:", error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: "Error adding car: " + error.message });
    }
});

export default router; // ✅ Use ES module export


// ✅ Fetch Car by ID
router.get("/:id", async (req, res) => {
    try {
        const carId = req.params.id;

        if (!carId) {
            return res.status(400).json({ message: "Car ID is required" });
        }

        const parsedCarId = parseInt(carId, 10);
        if (isNaN(parsedCarId)) {
            return res.status(400).json({ message: "Invalid Car ID" });
        }

        console.log("Fetching car with ID:", parsedCarId);

        // ✅ Use Sequelize's `.findOne()` instead of raw SQL
        const car = await Car.findOne({ where: { id: parsedCarId } });

        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        res.status(200).json(car); // ✅ Return car details
    } catch (error) {
        console.error("❌ Error fetching car:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// ✅ Check if a car is booked
router.get("/isBooked/:carId", async (req, res) => {
    try {
        const { carId } = req.params;

        // Check if the car exists in the Rentals table
        const existingBooking = await Rental.findOne({ where: { carId } });

        if (existingBooking) {
            return res.json({ booked: true });
        } else {
            return res.json({ booked: false });
        }
    } catch (error) {
        console.error("Error checking booking status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


