import axios from "axios";
import Rental from "../models/Rental.js";

// Global cache to hold STK Push status in memory for polling
export const paymentStatusCache = {};

// ✅ Internal helper: generate a fresh M-Pesa access token
async function getMpesaToken() {
    const secret = process.env.MPESA_CONSUMER_SECRET;
    const consumer = process.env.MPESA_CONSUMER_KEY;
    const auth = Buffer.from(`${consumer}:${secret}`).toString("base64");
    const response = await axios.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        { headers: { Authorization: `Basic ${auth}` } }
    );
    return response.data.access_token;
}

// ✅ 1. Generate M-Pesa Token Middleware (for routes that chain it)
export const generateToken = async (req, res, next) => {
    try {
        const secret = process.env.MPESA_CONSUMER_SECRET;
        const consumer = process.env.MPESA_CONSUMER_KEY;

        if (!secret || !consumer) {
            console.error("Missing M-Pesa credentials in .env");
            return res.status(500).json({ success: false, message: "Server misconfiguration regarding payment gateway." });
        }

        req.mpesaToken = await getMpesaToken();
        next();
    } catch (error) {
        console.error("Error generating M-Pesa token:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Error authenticating payment gateway." });
    }
};

// ✅ 5. Verify STK Payment — queries Safaricom directly to confirm real payment
export const verifySTKPayment = async (checkoutRequestId, mpesaToken) => {
    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

    try {
        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
            {
                BusinessShortCode: shortCode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId,
            },
            { headers: { Authorization: `Bearer ${mpesaToken}` }, timeout: 10000 }
        );

        // Successful HTTP response — check ResultCode
        const resultCode = parseInt(response.data.ResultCode);
        return {
            paid: resultCode === 0,
            resultCode,
            resultDesc: response.data.ResultDesc || "Unknown",
            apiReachable: true,
        };

    } catch (err) {
        const errData = err.response?.data;
        const httpStatus = err.response?.status;

        // Safaricom returns HTTP 400/500 with structured error data when the
        // transaction is found but in a terminal failed/cancelled state.
        // errorCode 500.001.1001 = "transaction does not exist" (timed out or cancelled)
        if (errData && errData.errorCode) {
            console.log(`📡 Safaricom STK Query structured error: ${errData.errorCode} — ${errData.errorMessage}`);
            return {
                paid: false,
                resultCode: httpStatus,
                resultDesc: errData.errorMessage || "Transaction not found or cancelled",
                apiReachable: true,  // API was reachable — this is a real "not paid" answer
            };
        }

        // Real network failure (timeout, DNS, etc.) — API was NOT reachable
        console.error("❌ STK Query network failure:", err.message);
        return {
            paid: false,
            resultCode: null,
            resultDesc: err.message,
            apiReachable: false,  // Could not reach Safaricom at all
        };
    }
};

// ✅ 6. Confirm Rental Payment — verifies with Safaricom then marks as paid
export const confirmRentalPayment = async (req, res) => {
    const { rentalId } = req.params;
    try {
        const rental = await Rental.findByPk(rentalId);

        if (!rental) {
            return res.status(404).json({ success: false, message: "Rental not found." });
        }

        // Already confirmed — idempotent
        if (rental.paymentStatus === "paid") {
            return res.status(200).json({ success: true, message: "Payment already confirmed." });
        }

        // Must have a checkoutRequestId (STK must have been initiated)
        if (!rental.checkoutRequestId) {
            return res.status(400).json({
                success: false,
                message: "No M-Pesa transaction linked to this booking. Please initiate payment first."
            });
        }

        // Get a fresh M-Pesa token
        let mpesaToken;
        try {
            mpesaToken = await getMpesaToken();
        } catch (tokenErr) {
            console.error("❌ Token error:", tokenErr.message);
            return res.status(500).json({ success: false, message: "Could not connect to M-Pesa. Please try again." });
        }

        // Query Safaricom to verify
        const verification = await verifySTKPayment(rental.checkoutRequestId, mpesaToken);

        if (!verification.apiReachable) {
            // Network failure — do not mark payment as paid without confirmation.
            console.warn(`⚠️  Safaricom unreachable for Rental #${rentalId}. Payment cannot be verified at this time.`);
            return res.status(503).json({
                success: false,
                message: "Unable to verify payment with M-Pesa right now. Please try again in a few moments."
            });
        }

        if (!verification.paid) {
            // Safaricom confirmed this is NOT paid (transaction cancelled, timed out, etc.)
            console.warn(`⚠️  Unverified attempt — Rental #${rentalId}: ${verification.resultDesc}`);
            return res.status(402).json({
                success: false,
                message: `Payment not confirmed by M-Pesa: "${verification.resultDesc}". Please complete the payment on your phone first.`
            });
        }

        // ✅ Safaricom confirmed payment
        await rental.update({ paymentStatus: "paid", status: "active" });  // ✅ Activate only after verified payment
        if (paymentStatusCache[rental.checkoutRequestId]) {
            paymentStatusCache[rental.checkoutRequestId].status = "paid";
        }

        console.log(`✅ Rental #${rentalId} verified as paid by Safaricom.`);
        res.status(200).json({ success: true, message: "Payment verified and confirmed!" });

    } catch (error) {
        console.error("❌ confirmRentalPayment error:", error);
        res.status(500).json({ success: false, message: "Server error during payment confirmation." });
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
            rentalId: accountReference.startsWith('RNTL-') ? accountReference.replace('RNTL-', '') : null
        };

        // Persist to Database for reliability
        if (accountReference.startsWith('RNTL-')) {
            await Rental.update({ checkoutRequestId: checkoutReqId }, { where: { id: accountReference.replace('RNTL-', '') } });
        }

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
        if (checkoutReqId) {
             if (paymentStatusCache[checkoutReqId]) {
                 paymentStatusCache[checkoutReqId].status = 'paid';
             }
             
             // Update the database (Rental) - Mark as paid AND activate
             const rentalRecord = await Rental.findOne({ where: { checkoutRequestId: checkoutReqId } });
             if (rentalRecord) {
                 await rentalRecord.update({ paymentStatus: 'paid', status: 'active' });  // ✅ Activate on confirmed payment
                 console.log(`✅ Rental DB record #${rentalRecord.id} marked as 'paid' and activated.`);
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
export const checkPaymentStatus = async (req, res) => {
    const { checkoutRequestId } = req.params;
    
    // 1. Check Memory Cache first (fastest)
    const cacheHit = paymentStatusCache[checkoutRequestId];
    if (cacheHit && cacheHit.status !== 'pending') {
        return res.status(200).json({ success: true, status: cacheHit.status });
    }

    try {
        const rental = await Rental.findOne({ where: { checkoutRequestId: checkoutRequestId } });
        if (rental && rental.paymentStatus === 'paid') {
            paymentStatusCache[checkoutRequestId] = { status: 'paid', rentalId: rental.id };
            return res.status(200).json({ success: true, status: 'paid' });
        }

        if (!rental || !rental.checkoutRequestId) {
            return res.status(404).json({ success: false, status: 'pending', message: 'No linked payment found.' });
        }

        paymentStatusCache[checkoutRequestId] = { status: 'pending', rentalId: rental.id };

        // Try to verify payment with Safaricom directly if still pending.
        let mpesaToken;
        try {
            mpesaToken = await getMpesaToken();
        } catch (tokenError) {
            console.warn("⚠️ Could not obtain M-Pesa token while checking status:", tokenError.message);
            return res.status(200).json({ success: true, status: cacheHit ? cacheHit.status : 'pending' });
        }

        const verification = await verifySTKPayment(checkoutRequestId, mpesaToken);
        if (verification.apiReachable && verification.paid) {
            await rental.update({ paymentStatus: 'paid', status: 'active' });
            paymentStatusCache[checkoutRequestId] = { status: 'paid', rentalId: rental.id };
            return res.status(200).json({ success: true, status: 'paid' });
        }

        if (verification.apiReachable && !verification.paid) {
            // The transaction was verified as not completed or canceled.
            const failedStatus = verification.resultDesc?.toLowerCase().includes('cancel') || verification.resultDesc?.toLowerCase().includes('failed') ? 'failed' : 'pending';
            if (failedStatus === 'failed') {
                paymentStatusCache[checkoutRequestId] = { status: 'failed', rentalId: rental.id };
            }
            return res.status(200).json({ success: true, status: failedStatus });
        }

        // API not reachable, keep returning pending until next check.
        return res.status(200).json({ success: true, status: cacheHit ? cacheHit.status : 'pending' });
    } catch (error) {
        console.error("Status Check DB Error:", error);
        return res.status(200).json({ success: true, status: 'pending' });
    }
};
