import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import db from "../config/db.js";  // Ensure MySQL connection is imported
import { getAllCars, addCar, deleteCar } from "../controllers/carController.js";

import Car from "../models/Car.js"; // ✅ Ensure file extension is included
import Rental from "../models/Rental.js";

const router = express.Router();

// ✅ Fetch all cars for admin
router.get("/admin/cars",  getAllCars);

// ✅ Add a new car (Admin Only)
//router.post("/admin/cars", verifyAdminToken, carController.addCar);

// ✅ Delete a car (Admin Only)
router.delete("/admin/cars/:id",  deleteCar);

// ✅ Add a New Car
router.post("/", verifyToken, verifyAdmin, upload.single("image"), async (req, res) => {
    try {
        const { name, description, color, vehicleType, hireCostPerDay } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const newCar = await Car.create({ name, description, color, vehicleType, hireCostPerDay, imageUrl });

        res.status(201).json({ message: "Car added successfully", car: newCar });
    } catch (error) {
        res.status(500).json({ error: "Error adding car: " + error.message });
    }
});

// 📋 Get all cars (Ensure image is sent as Base64)
router.getAllCars = async (req, res) => {
    try {
        const cars = await Car.findAll();
        
        // Convert BLOB to Base64
        const formattedCars = cars.map(car => ({
            id: car.id,
            carName: car.carName,
            description: car.description,
            color: car.color,
            vehicleType: car.vehicleType,
            costPerDay: car.costPerDay,
            image: car.image ? `data:image/png;base64,${car.image.toString("base64")}` : null
        }));

        res.status(200).json({ success: true, cars: formattedCars });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error retrieving cars", error: error.message });
    }
};



// ✅ Edit Car Details
router.put("/:id", verifyToken, verifyAdmin, upload.single("image"), async (req, res) => {
    try {
        const { name, description, color, vehicleType, hireCostPerDay } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        await Car.update(
            { name, description, color, vehicleType, hireCostPerDay, imageUrl },
            { where: { id: req.params.id } }
        );

        res.json({ message: "Car updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error updating car: " + error.message });
    }
});

// ✅ Delete Car
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        await Car.destroy({ where: { id: req.params.id } });
        res.json({ message: "Car deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting car: " + error.message });
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


