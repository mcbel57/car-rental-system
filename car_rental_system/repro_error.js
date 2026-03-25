import db from "./config/db.js";
import bcrypt from "bcryptjs";

const reproduceError = async () => {
    try {
        console.log("--- Testing Duplicate ID Number ---");
        // Get an existing user's ID number
        const existingUser = await db.User.findOne();
        if (!existingUser) {
            console.log("No users found to test duplicate. Skipping.");
        } else {
            console.log(`Attempting to create user with duplicate ID: ${existingUser.idNumber}`);
            try {
                await db.User.create({
                    firstName: "Test",
                    lastName: "User",
                    email: "test_duplicate_id@example.com",
                    phoneNumber: "1234567890",
                    idNumber: existingUser.idNumber,
                    password: await bcrypt.hash("password123", 10),
                    role: "user"
                });
                console.log("❌ Error: Created user with duplicate ID (this should have failed)");
            } catch (err) {
                console.log("✅ Expected Failure (Duplicate ID):", err.name, err.message);
            }
        }

        console.log("\n--- Testing ID Number Length (VARCAHR(9)) ---");
        try {
            const longId = "12345678901"; // 11 characters
            console.log(`Attempting to create user with long ID: ${longId}`);
            await db.User.create({
                firstName: "Test",
                lastName: "User",
                email: "test_long_id@example.com",
                phoneNumber: "1234567890",
                idNumber: longId,
                password: await bcrypt.hash("password123", 10),
                role: "user"
            });
            console.log("❌ Error: Created user with too long ID (this should have failed if DB enforces length)");
        } catch (err) {
            console.log("✅ Failure (Long ID):", err.name, err.message);
        }

        process.exit(0);
    } catch (error) {
        console.error("Unexpected Error:", error);
        process.exit(1);
    }
};

reproduceError();
