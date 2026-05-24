import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import multer from "multer";
import db from "./config/db.js";  // ✅ Importing updated DB (which includes models)

// ✅ Load environment variables
dotenv.config();

// ✅ Import all routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import carRoutes from "./routes/carRoutes.js";
import rentalRoutes from "./routes/rentalRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

import { verifyToken } from "./middleware/authMiddleware.js";

// ✅ Define __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Initialize Express app
const app = express();
const PORT = 5002;

// ✅ Multer Configuration (for handling file uploads)
const upload = multer({ dest: "uploads/" });

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(morgan("dev")); // Log all requests (GET, POST, etc.)

// ✅ Serve Static Files (Frontend HTML)
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

// ✅ Root Route (Loads index.html)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Load All API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/rentals', rentalRoutes);
app.use("/api/bookings", bookingRoutes);

app.use("/api/inquiries", inquiryRoutes);
app.use("/api/payment", paymentRoutes);

// ✅ Global Error Handler (Ensures all errors return JSON)
app.use((err, req, res, next) => {
    console.error("❌ Global Error:", err.message);
    
    // Handle Multer Errors
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: "Upload Error: " + err.message });
    }
    
    // Handle Custom Errors (like from fileFilter)
    if (err.message && (err.message.includes("formats allowed") || err.message.includes("required"))) {
        return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: err.message || "Internal Server Error" });
});

// ✅ Protected Route Example (User Dashboard)
app.get("/api/user/dashboard", verifyToken, (req, res) => {
    res.json({ message: `Welcome, user ID: ${req.user.userId}` });
});

// ✅ Authenticate Database Connection (Skip auto-alter to prevent hangs)
db.sequelize.authenticate()
    .then(() => console.log("✅ SQLite connected successfully"))
    .catch(err => console.error("❌ Database connection error:", err));

// ✅ Sync Database Tables
db.syncDatabase()
    .then(() => console.log("✅ Database ready for use"))
    .catch(err => console.error("❌ Database sync failed:", err));

// ✅ Start Server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ✅ Crash Reporting
process.on('uncaughtException', err => {
    console.error('❌ Uncaught exception - shutting down:', err);
    server.close(() => process.exit(1));
});

process.on('unhandledRejection', reason => {
    console.error('❌ Unhandled promise rejection - shutting down:', reason);
    server.close(() => process.exit(1));
});

