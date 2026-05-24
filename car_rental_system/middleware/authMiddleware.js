import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// ✅ Middleware to Verify JWT Token

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    console.log("🔍 Received Auth Header:", authHeader); // Debugging line

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded user data to `req.user`
        req.user.id = decoded.userId; // Backward compatibility for routes using req.user.id
        console.log("✅ Decoded Token Data:", req.user); // Debugging line
        next();
    } catch (error) {
        console.error("❌ Token Verification Error:", error);
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }
};

// ✅ Middleware to Verify Customer Access
export const verifyCustomer = (req, res, next) => {
    try {
        if (!req.user || (req.user.role !== "customer" && req.user.role !== "admin")) {
            return res.status(403).json({ error: "Access denied. Customers only." });
        }
        next();
    } catch (error) {
        console.error("❌ Customer Verification Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Middleware to Verify Admin Access
export const verifyAdmin = (req, res, next) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied. Admins only." });
        }
        next();
    } catch (error) {
        console.error("❌ Admin Verification Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

export const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ success: false, message: "Access denied." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "admin") throw new Error("Unauthorized");
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid token." });
    }
};

// ✅ Middleware to Verify Driver Access
export const verifyDriver = (req, res, next) => {
    try {
        if (!req.user || (req.user.role !== "driver" && req.user.role !== "admin")) {
            return res.status(403).json({ error: "Access denied. Drivers only." });
        }
        next();
    } catch (error) {
        console.error("❌ Driver Verification Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};