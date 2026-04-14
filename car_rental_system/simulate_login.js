import db from './config/db.js';
import bcrypt from 'bcryptjs';

async function simulateLogin() {
    try {
        console.log("🔍 Simulating login for a test user...");
        
        // Find any user
        const user = await db.User.findOne();
        if (!user) {
            console.log("ℹ️ No users found to test login.");
            process.exit(0);
        }

        console.log("✅ User found in DB:", user.email);
        console.log("🎉 User object keys:", Object.keys(user.toJSON()));
        
        // Test bcrypt just in case
        const isMatch = await bcrypt.compare("anypassword", user.password);
        console.log("🔐 Bcrypt test completed (match result doesn't matter):", isMatch);

        process.exit(0);
    } catch (error) {
        console.error("❌ SIMULATED LOGIN ERROR:", error.message);
        console.error("📋 STACK TRACE:", error.stack);
        process.exit(1);
    }
}

simulateLogin();
