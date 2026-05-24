import bcrypt from "bcryptjs";
import User from "./models/User.js";
import db from "./config/db.js";

async function resetAdmin() {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("user123", salt);

        await User.update(
            { password: hashedPassword },
            { where: { email: "Pakakumi57@outlook.com" } }
        );

        console.log("✅ User password reset to 'user123'");
        process.exit(0);
    } catch (error) {
        console.error("❌ Reset failed:", error);
        process.exit(1);
    }
}

resetAdmin();
