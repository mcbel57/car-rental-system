import db from "../config/db.js";
import { Op } from "sequelize";
import Car from "../models/Car.js";

// 🏎️ Add a new car
export const addCar = async (req, res) => {
    try {
        const { carName, description, color, vehicleType, costPerDay, image } = req.body;
        const newCar = await Car.create({ carName, description, color, vehicleType, costPerDay, image });
        res.status(201).json({ success: true, message: "Car added successfully!", car: newCar });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error adding car", error: error.message });
    }
};

// 🛠️ Edit a car
export const editCar = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCar = await Car.update(req.body, { where: { id } });
        res.status(200).json({ success: true, message: "Car updated successfully!", updatedCar });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating car", error: error.message });
    }
};

// ✅ Delete a car
export const deleteCar = async (req, res) => {
    try {
        const { id } = req.params;
        const car = await Car.findByPk(id);

        if (!car) return res.status(404).json({ error: "Car not found." });

        await car.destroy();
        res.json({ message: "Car deleted successfully." });
    } catch (error) {
        console.error("❌ Error deleting car:", error);
        res.status(500).json({ error: "Failed to delete car." });
    }
};

// 📋 Get all cars (with booked dates)
export const getAllCars = async (req, res) => {
    try {
        const cars = await Car.findAll();

        // Convert BLOB to Base64 (or keep if already URL)
        const formatImage = (image) => {
            if (!image) return null;
            if (typeof image === "string" && image.startsWith("http")) return image;
            try {
                return `data:image/png;base64,${Buffer.from(image).toString("base64")}`;
            } catch (e) {
                return image; // Fallback
            }
        };

        const formattedCars = await Promise.all(cars.map(async (car) => {
            // Only get ACTIVE rentals (confirmed payments)
            // Exclude pending (payment not yet confirmed) and cancelled
            const rentals = await db.Rental.findAll({ 
                where: { 
                    carId: car.id, 
                    status: "active"  // ✅ Only block for confirmed bookings
                },
                attributes: ["rentalDate", "rentalDays"]
            });

            // Build list of booked dates
            const bookedDates = [];
            rentals.forEach(rental => {
                const startDate = new Date(rental.rentalDate);
                for (let i = 0; i < rental.rentalDays; i++) {
                    const date = new Date(startDate);
                    date.setDate(date.getDate() + i);
                    bookedDates.push(date.toISOString().split("T")[0]);
                }
            });

            return {
                id: car.id,
                carName: car.carName,
                description: car.description,
                color: car.color,
                vehicleType: car.vehicleType,
                costPerDay: car.costPerDay,
                image: formatImage(car.image),
                bookedDates: bookedDates
            };
        }));

        res.status(200).json({ success: true, cars: formattedCars });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error retrieving cars", error: error.message });
    }
};

// ✅ Get a single car by ID
export const getCarById = async (req, res) => {
    try {
        const carId = parseInt(req.params.id, 10);

        if (isNaN(carId)) {
            return res.status(400).json({ message: "Invalid Car ID" });
        }

        const car = await Car.findOne({ where: { id: carId } });

        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        res.status(200).json(car);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};