
import db from "./config/db.js";

const debugDatabase = async () => {
    try {
        await db.sequelize.authenticate();
        console.log("✅ Connect to SQLite.");

        const users = await db.User.findAll();
        console.log("\n👥 Users found:", users.length);
        users.forEach(u => console.log(` - [${u.id}] ${u.email} (${u.role})`));

        const bookings = await db.Rental.findAll();
        console.log("\n📅 Bookings found:", bookings.length);
        bookings.forEach(b => console.log(` - [${b.id}] CarID: ${b.carId}, UserID: ${b.userId}, Date: ${b.rentalDate}`));

    } catch (error) {
        console.error("❌ Error:", error);
    }
};

debugDatabase();
