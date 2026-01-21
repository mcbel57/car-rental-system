import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Ensure you have a User model
import dotenv from "dotenv";
import { Op } from "sequelize";


dotenv.config();

console.log("🔑 JWT_SECRET:", process.env.JWT_SECRET);


export const registerUser = async (req, res) => {
    try {
        console.log("🔥 Incoming Registration Request:", req.body);

        const { firstName, lastName, email, phoneNumber, idNumber, password, confirmPassword } = req.body;

        // 🛑 Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        // 🔎 Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        // 🏷️ Determine User Role
        const role = email.endsWith("@rentify.com") ? "admin" : "user";

        // 🔐 Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 📌 Create New User
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            phoneNumber,
            idNumber,
            password: hashedPassword,
            role, // Save the role to the database
        });

        res.status(201).json({ message: "User registered successfully!", user: newUser });

    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ error: "Server error, please try again" });
    }
};





export const loginUser = async (req, res) => {
  try {
    console.log("🔥 Incoming Login Request:", req.body);
    const { email, password } = req.body;

    // 🔎 Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // 🔐 Validate Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // ✅ Ensure user role exists (defaults to "user" if not defined)
    const role = user.role || "user";

    // 🎟️ Generate JWT Token (including role)
    const token = jwt.sign(
      { userId: user.id, role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 🌍 Determine redirect based on role
    const redirectTo = role === "admin" ? "/admin_dashboard.html" : "/user_dashboard.html";

    // 🌟 Send user details, token, and redirect path in response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        idNumber: user.idNumber,
        role: user.role,
      },
      redirectTo,
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ error: "Server error, please try again" });
  }
};



// ✅ Get User Profile (Protected Route)
export const getUserProfile = async (req, res) => {
    try {
        console.log("🔍 Fetching User Profile for:", req.userId);

        const user = await User.findByPk(req.userId, {
            attributes: { exclude: ["password"] } // Hide password in response
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("❌ Profile Fetch Error:", error);
        res.status(500).json({ error: "Server error, please try again" });
    }
};

