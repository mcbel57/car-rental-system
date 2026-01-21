import express from "express";
import { getAllCars, getCarById } from "../controllers/userCarController.js"; // ✅ Updated import

const router = express.Router();

// ✅ Get all available cars (For regular users)
router.get("/", getAllCars);

// ✅ Get a single car by ID
router.get("/:id", getCarById);

export default router;
