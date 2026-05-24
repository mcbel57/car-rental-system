
import db from "../../config/db.js";
import bcrypt from "bcryptjs";

const seedDatabase = async () => {
    try {
        await db.sequelize.authenticate();
        console.log("✅ Connected to SQLite database.");

        // Sync database - NEVER use force: true (it deletes all data!)
        await db.sequelize.sync({ alter: false });
        console.log("✅ Database synchronized.");

        // Check if admin already exists
        const adminExists = await db.User.findOne({ where: { email: "admin@example.com" } });
        if (adminExists) {
            console.log("✅ Admin user already exists, skipping creation.");
        } else {
            // Create Admin User
            const passwordHash = await bcrypt.hash("admin123", 10);
            await db.User.create({
                firstName: "Admin",
                lastName: "User",
                email: "admin@example.com",
                phoneNumber: "1234567890",
                idNumber: "ADMIN001",
                password: passwordHash,
                role: "admin"
            });
            console.log("✅ Admin user created: admin@example.com / admin123");
        }

        // Create Sample Cars - Skip if they already exist
        const cars = [
            {
                carName: "Toyota Camry",
                description: "Reliable and comfortable sedan for daily commute.",
                color: "Silver",
                vehicleType: "FWD",
                costPerDay: 50.0,
                image: "https://upload.wikimedia.org/wikipedia/commons/a/ac/2018_Toyota_Camry_%28ASV70R%29_Ascent_sedan_%282018-08-27%29_01.jpg"
            },
            {
                carName: "Honda CR-V",
                description: "Spacious SUV perfect for family trips.",
                color: "White",
                vehicleType: "AWD",
                costPerDay: 80.0,
                image: "https://upload.wikimedia.org/wikipedia/commons/d/da/2017_Honda_CR-V_%28RW%29_VTi-LX_2WD_wagon_%282018-08-27%29.jpg"
            },
            {
                carName: "Ford Mustang",
                description: "Classic American muscle car for a thrilling drive.",
                color: "Red",
                vehicleType: "RWD",
                costPerDay: 120.0,
                image: "https://upload.wikimedia.org/wikipedia/commons/d/d1/2018_Ford_Mustang_GT_5.0.jpg"
            }
        ];

        let carsCreated = 0;
        for (const car of cars) {
            const carExists = await db.Car.findOne({ where: { carName: car.carName } });
            if (!carExists) {
                await db.Car.create(car);
                carsCreated++;
            }
        }
        if (carsCreated > 0) {
            console.log(`✅ Added ${carsCreated} new sample cars.`);
        } else {
            console.log("✅ Sample cars already exist, skipping creation.");
        }

        console.log("🎉 Seeding completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
};

seedDatabase();
