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
import userCarRoutes from "./routes/userCarRoutes.js";
import leaseRoutes from "./routes/leaseRoutes.js";

import { verifyToken } from "./middleware/authMiddleware.js";

// ✅ Define __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

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
app.use('/api/cars', carRoutes); // Standard route for cars
app.use('/api/rentals', rentalRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/leases", leaseRoutes);

// ✅ Protected Route Example (User Dashboard)
app.get("/api/user/dashboard", verifyToken, (req, res) => {
    res.json({ message: `Welcome, user ID: ${req.user.userId}` });
});

// ✅ Sync Database using `db.sequelize`
db.sequelize.sync({ alter: true }) // ✅ Updates tables based on model changes
    .then(() => console.log("✅ Database synchronized"))
    .catch(err => console.error("❌ Error syncing database:", err));

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

