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

    const { firstName, lastName, email, phoneNumber, idNumber, password, confirmPassword, role: requestedRole, licenseNumber } = req.body;

    // 🛑 Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
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
    // If requestedRole is 'driver', we use that. Otherwise fallback to email check or 'user'
    let role = "user";
    let driverStatus = null;
    if (requestedRole === "driver") {
      role = "user"; // Originally I thought 'driver', but maybe we keep them as 'user' until approved? 
      // Wait, the plan said "Add a new role: "driver"". So we should save it as pending or something.
      // But if we save as 'driver' immediately, they can login as driver.
      // Let's check the plan: "Add driverStatus (ENUM: 'pending', 'approved'...)".
      // If we save 'role' as 'driver' immediately, they might access driver routes.
      // But verifyDriver checks `req.user.role !== "driver"`.
      // So if `driverStatus` is pending, maybe we should still be 'user' role until approved?
      // "If status === "approved" updateData.role = "driver";" from my leaseRoutes code.
      // So initially role should be "user" or maybe "driver_applicant"?
      // Let's stick to the plan in leaseRoutes: "If status === 'approved' updateData.role = 'driver'".
      // So initially role is 'user', but we save `driverStatus: 'pending'` and `licenseNumber`.
      role = "user";
      driverStatus = "pending";
    } else if (email.endsWith("@rentify.com")) {
      role = "admin";
    }

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
      licenseNumber: licenseNumber || null,
      driverStatus: driverStatus || null,
    });

    res.status(201).json({ message: "User registered successfully!", user: newUser });

  } catch (error) {
    console.error("❌ Registration Error:", error);
    
    // 🛑 Specific handling for Sequelize Validation/Unique Errors
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0].path;
      const message = field === "email" ? "Email is already registered" : 
                      field === "idNumber" ? "ID Number is already registered" : 
                      "Record already exists";
      return res.status(400).json({ error: message });
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.errors[0].message });
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

    // ✅ Ensure user role exists (defaults to "user" if not defined)
    const role = user.role || "user";

    // 🎟️ Generate JWT Token (including role)
    const token = jwt.sign(
      { userId: user.id, role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 🌍 Determine redirect based on role
    let redirectTo = "user_dashboard.html";
    if (role === "admin") {
      redirectTo = "admin_dashboard.html";
    } else if (role === "driver") {
      redirectTo = "driver_dashboard.html";
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

