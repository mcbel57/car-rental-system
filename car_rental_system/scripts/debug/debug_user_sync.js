import db from './config/db.js';

async function testConnection() {
    try {
        console.log("🔍 Attempting to find a user in the database...");
        const user = await db.User.findOne();
        if (user) {
            console.log("✅ User found:", user.firstName);
        } else {
            console.log("ℹ️ No users in database.");
        }
        process.exit(0);
    } catch (error) {
        console.error("❌ SQL Error detected:", error.message);
        process.exit(1);
    }
}

testConnection();
