import express from "express";
import { generateToken, initiateSTKPush, stkCallback, checkPaymentStatus } from "../controllers/paymentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to trigger STK Push
router.post("/stkpush", verifyToken, generateToken, initiateSTKPush);

// Webhook route for Safaricom to call back
router.post("/callback", stkCallback);

// Frontend route to poll and check cache
router.get("/status/:checkoutRequestId", verifyToken, checkPaymentStatus);

export default router;
