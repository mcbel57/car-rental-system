import express from "express";
import { generateToken, initiateSTKPush, stkCallback, checkPaymentStatus, confirmRentalPayment } from "../controllers/paymentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Trigger M-Pesa STK Push
router.post("/stkpush", verifyToken, generateToken, initiateSTKPush);

// Safaricom callback webhook (called by Safaricom servers after payment)
router.post("/callback", stkCallback);

// Frontend polling endpoint to check payment status
router.get("/status/:checkoutRequestId", verifyToken, checkPaymentStatus);

// ✅ Customer "I've Paid" button — verifies with Safaricom before confirming
router.post("/confirm/:rentalId", verifyToken, confirmRentalPayment);

export default router;
