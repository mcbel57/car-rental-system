import Car from "../models/Car.js"; // ✅ Import the Car model

// ✅ Fetch All Cars for Regular Users
export const getAllCars = async (req, res) => {
    try {
        const cars = await Car.findAll();

        if (!cars.length) {
            return res.status(404).json({ success: false, message: "No cars found" });
        }

        // ✅ Convert BLOB image to Base64
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
        console.error("❌ Error fetching cars:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ✅ Fetch a Single Car by ID
export const getCarById = async (req, res) => {
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

        // ✅ Convert BLOB to Base64
        const formattedCar = {
            id: car.id,
            carName: car.carName,
            description: car.description,
            color: car.color,
            vehicleType: car.vehicleType,
            costPerDay: car.costPerDay,
            image: car.image ? `data:image/png;base64,${car.image.toString("base64")}` : null
        };

        res.status(200).json({ success: true, car: formattedCar });

    } catch (error) {
        console.error("❌ Error fetching car:", error);
        res.status(500).json({ message: "Server error. Please try again later.", error: error.message });
    }
};
