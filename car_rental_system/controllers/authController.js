import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Ensure you have a User model
import dotenv from "dotenv";
import { Op } from "sequelize";
import Tesseract from "tesseract.js";
import path from "path";
import fs from "fs";

dotenv.config();

console.log("🔑 JWT_SECRET:", process.env.JWT_SECRET);

export const registerUser = async (req, res) => {
  try {
    console.log("🔥 Incoming Registration Request:", req.body);
    console.log("📷 Incoming File:", req.file);

    const { firstName, lastName, email, phoneNumber, idNumber, password, confirmPassword, role: requestedRole } = req.body;

    // 🛑 Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // 📱 Validate Phone Number (Kenyan Format)
    const phoneRegex = /^(?:\+254|0)(?:7|1)[0-9]{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ error: "Invalid Phone Number. Use format +254... or 07.../01..." });
    }

    // 🆔 Validate National ID (7-8 digits)
    const idRegex = /^[0-9]{7,8}$/;
    if (!idRegex.test(idNumber)) {
      return res.status(400).json({ error: "Invalid National ID. Must be 7-8 digits." });
    }

    // 🔎 Check if email or ID Number already exists
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email },
          { idNumber }
        ]
      } 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email is already registered" });
      }
      if (existingUser.idNumber === idNumber) {
        return res.status(400).json({ error: "ID Number is already registered" });
      }
    }

    // 🏷️ Determine User Role
    let role = "customer";
    let driverStatus = null; // Only drivers get a driverStatus

    if (email.endsWith("@rentify.com") && requestedRole !== "driver") {
      role = "admin";
    } else if (requestedRole === "driver") {
      role = "customer"; // Kept as customer until approved by admin
      driverStatus = "pending";
    }
    // ✅ Pure customers have driverStatus = null (no vetting needed)

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
      role,
      driverStatus,
      ocrFlag: null,
      verificationNotes: null
    });

    res.status(201).json({ message: "User registered successfully!", user: newUser });

  } catch (error) {
    console.error("❌ Registration Error:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0].path;
      const message = field === "email" ? "Email is already registered" : 
                      field === "idNumber" ? "ID Number is already registered" : 
                      "Record already exists";
      return res.status(400).json({ error: message });
    }

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

    // ✅ Ensure user role exists (defaults to "customer" if not defined)
    const role = user.role || "customer";

    // 🎟️ Generate JWT Token (including role)
    const token = jwt.sign(
      { userId: user.id, role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 🌍 Determine redirect based on role
    let redirectTo = "customer_dashboard.html";
    if (role === "admin") {
      redirectTo = "admin_dashboard.html";
    }

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
        driverStatus: user.driverStatus,
        notification: user.notification,
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

