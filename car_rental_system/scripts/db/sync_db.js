import db from "../../config/db.js";

async function syncDB() {
    try {
        // Sync modified tables only to avoid issues with Users table and constraints in SQLite alter
        await db.Rental.sync({ alter: true });
        await db.Inquiry.sync({ alter: true });
        
        console.log("✅ Modified tables synchronized successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Sync failed:", error);
        process.exit(1);
    }
}

syncDB();
