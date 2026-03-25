import axios from "axios";
import Rental from "../models/Rental.js";

// Global cache to hold STK Push status in memory for polling
export const paymentStatusCache = {};

// ✅ 1. Generate M-Pesa Token Middleware
export const generateToken = async (req, res, next) => {
    try {
        const secret = process.env.MPESA_CONSUMER_SECRET;
        const consumer = process.env.MPESA_CONSUMER_KEY;

        if (!secret || !consumer) {
            console.error("Missing M-Pesa credentials in .env");
            return res.status(500).json({ success: false, message: "Server misconfiguration regarding payment gateway." });
        }

        const auth = Buffer.from(`${consumer}:${secret}`).toString("base64");

        const response = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        );

        req.mpesaToken = response.data.access_token;
        next();
    } catch (error) {
        console.error("Error generating M-Pesa token:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Error authenticating payment gateway." });
    }
};

// ✅ 2. Initiate STK Push
export const initiateSTKPush = async (req, res) => {
    try {
        const { phone, amount, accountReference, transactionDesc } = req.body;

        const shortCode = process.env.MPESA_SHORTCODE;
        const passkey = process.env.MPESA_PASSKEY;
        const callbackUrl = process.env.MPESA_CALLBACK_URL; // Update this via localtunnel/ngrok

        if (!shortCode || !passkey || !callbackUrl) {
            return res.status(500).json({ success: false, message: "Missing M-Pesa configuration in environment." });
        }

        // Format phone number to 2547XXXXXX
        let formattedPhone = phone.replace(/\s+/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = `254${formattedPhone.substring(1)}`;
        } else if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.substring(1);
        }

        const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

        const payload = {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline", // Use CustomerBuyGoodsOnline for Till Numbers
            Amount: Math.ceil(amount), // Daraja only accepts integers
            PartyA: formattedPhone, // The phone number sending the money
            PartyB: shortCode, // The business shortcode
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: accountReference, // Usually the booking ID or user ID
            TransactionDesc: transactionDesc || "Car Rental Deposit",
        };

        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            payload,
            {
                headers: {
                    Authorization: `Bearer ${req.mpesaToken}`,
                },
            }
        );

        const checkoutReqId = response.data.CheckoutRequestID;
        
        // Store in global cache mapping
        paymentStatusCache[checkoutReqId] = {
            status: 'pending',
            rentalId: accountReference.replace('RNTL-', '')
        };

        res.status(200).json({ 
            success: true, 
            message: "STK Push queued successfully.", 
            checkoutRequestId: checkoutReqId,
            data: response.data 
        });
    } catch (error) {
        console.error("STK Push Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Failed to initiate M-Pesa payment.", error: error.response?.data });
    }
};

// ✅ 3. Handle Safaricom Callback
export const stkCallback = async (req, res) => {
    try {
        console.log("---- M-Pesa Callback Received ----");
        console.log(JSON.stringify(req.body, null, 2));

        const callbackData = req.body.Body?.stkCallback;

        if (!callbackData) {
            console.error("Invalid Callback Data");
            return res.status(400).send("Invalid callback data");
        }

        const resultCode = callbackData.ResultCode;
        const resultDesc = callbackData.ResultDesc;
        const checkoutReqId = callbackData.CheckoutRequestID;

        if (resultCode !== 0) {
            // Payment failed or was canceled
            console.error(`Payment failed/canceled: ${resultDesc}`);
            if (checkoutReqId && paymentStatusCache[checkoutReqId]) {
                paymentStatusCache[checkoutReqId].status = 'failed';
            }
            return res.status(200).send("Callback received (Failed/Canceled)");
        }

        // 🟢 Payment was successful.
        if (checkoutReqId && paymentStatusCache[checkoutReqId]) {
             paymentStatusCache[checkoutReqId].status = 'paid';
             
             // Update the database
             const rentalId = paymentStatusCache[checkoutReqId].rentalId;
             if (rentalId) {
                 await Rental.update({ paymentStatus: 'paid' }, { where: { id: rentalId } });
                 console.log(`✅ Rental DB record #${rentalId} marked as 'paid'.`);
             }
        }

        const bodyItems = callbackData.CallbackMetadata.Item;
        let amount = 0;
        let mpesaReceiptNumber = "";

        bodyItems.forEach(item => {
            if (item.Name === "Amount") amount = item.Value;
            if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = item.Value;
        });

        console.log(`✅ Webhook Success! CheckoutReqID: ${checkoutReqId}, Receipt: ${mpesaReceiptNumber}, Amount: ${amount}`);
        res.status(200).json({ success: true, message: "Callback processed successfully." });
    } catch (error) {
        console.error("Callback Error:", error.message);
        res.status(500).send("Internal Server Error processing callback");
    }
};

// ✅ 4. Check Payment Status Point (Used by Frontend Polling)
export const checkPaymentStatus = (req, res) => {
    const { checkoutRequestId } = req.params;
    const cacheHit = paymentStatusCache[checkoutRequestId];
    
    if (!cacheHit) {
        return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    res.status(200).json({ success: true, status: cacheHit.status });
};
