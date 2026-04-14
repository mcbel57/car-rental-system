import db from './config/db.js';
import bcrypt from 'bcryptjs';

async function simulateRegistration() {
    try {
        console.log("🔍 Simulating registration for a test driver...");
        
        const email = `test_driver_${Date.now()}@example.com`;
        const newUser = await db.User.create({
            firstName: "Test",
            lastName: "Driver",
            email: email,
            phoneNumber: "0712345678",
            idNumber: `ID_${Date.now()}`,
            password: await bcrypt.hash("password123", 10),
            licenseNumber: "LIC123",
            role: "user",
            driverStatus: "pending",
            ocrFlag: "Legitimate",
            verificationNotes: "Test verification"
        });

        console.log("✅ New user created ID:", newUser.id);
        
        // Now try to find it
        const found = await db.User.findOne({ where: { email } });
        if (found) {
            console.log("✅ Verification successful. Saved ocrFlag:", found.ocrFlag);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ SIMULATED REGISTRATION ERROR:", error.message);
        console.error("📋 FULL ERROR:", error);
        process.exit(1);
    }
}

simulateRegistration();
