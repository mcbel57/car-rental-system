import db from "./config/db.js";

const checkCars = async () => {
    try {
        const cars = await db.Car.findAll();
        console.log("Cars in DB:");
        console.table(cars.map(c => ({
            id: c.id,
            name: c.carName,
            leasable: c.isAvailableForLease,
            weeklyCost: c.weeklyLeaseCost
        })));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkCars();
