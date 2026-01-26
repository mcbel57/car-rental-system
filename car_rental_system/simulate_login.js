import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./config/db.js";
import dotenv from "dotenv";
dotenv.config();

const simulateLogin = async (email, password) => {
    try {
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            console.log("User not found");
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Password mismatch");
            return;
        }

        const role = user.role || "user";
        let redirectTo = "user_dashboard.html";
        if (role === "admin") {
            redirectTo = "admin_dashboard.html";
        } else if (role === "driver") {
            redirectTo = "driver_dashboard.html";
        }

        console.log(`Email: ${email}`);
        console.log(`Role in DB: "${user.role}"`);
        console.log(`Normalized Role: "${role}"`);
        console.log(`Redirect Path: "${redirectTo}"`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

simulateLogin("greenfam255@gmail.com", "mahrin001");
