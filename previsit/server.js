require('dotenv').config();   // loads KEY_ID & KEY_SECRET from .env file

/**
 * PreVisit — Razorpay Backend Server
 * ------------------------------------
 * Handles:
 *   POST /api/create-order   → creates a Razorpay order (₹199)
 *   POST /api/verify-payment → verifies HMAC signature after payment
 *
 * HOW TO RUN:
 *   1. npm install
 *   2. Fill in your KEY_ID and KEY_SECRET below (or use a .env file)
 *   3. node server.js
 *   4. Server starts at http://localhost:3000
 */

const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());                          // allow your HTML page to call this server
app.use(express.static(path.join(__dirname, 'public'))); // serves index.html & checkout.html

// ─────────────────────────────────────────
//  🔑  PUT YOUR RAZORPAY KEYS HERE
//  Get them from: https://dashboard.razorpay.com → Settings → API Keys
//  Use TEST keys for testing, LIVE keys for real payments.
// ─────────────────────────────────────────
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET || KEY_ID.includes('XXXX')) {
    console.error('\n❌  Missing Razorpay keys! Copy .env.example → .env and fill them in.\n');
    process.exit(1);
}

const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET,
});

const PRICE_INR = 199;               // ₹199
const PRICE_PAISE = PRICE_INR * 100;  // Razorpay works in paise (smallest unit)

// ─────────────────────────────────────────
//  STEP 1 — Create an Order
//  Called by checkout.html before opening the Razorpay popup.
//  Returns { orderId, amount, currency, keyId }
// ─────────────────────────────────────────
app.post('/api/create-order', async (req, res) => {
    const { name, email, contact } = req.body;

    // Basic validation
    if (!name || !email || !contact) {
        return res.status(400).json({ error: 'name, email and contact are required.' });
    }

    try {
        const order = await razorpay.orders.create({
            amount: PRICE_PAISE,
            currency: 'INR',
            receipt: `previsit_${Date.now()}`,   // your internal reference
            notes: {
                customer_name: name,
                customer_email: email,
                customer_phone: contact,
            },
        });

        // Send back what the frontend needs
        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: KEY_ID,
        });

    } catch (err) {
        console.error('Razorpay order creation failed:', err);
        res.status(500).json({ error: 'Could not create order. Check your API keys.' });
    }
});

// ─────────────────────────────────────────
//  STEP 2 — Verify Payment Signature
//  After the user pays, Razorpay returns:
//    razorpay_payment_id, razorpay_order_id, razorpay_signature
//  We MUST verify the signature before fulfilling the order.
//  Returns { verified: true } or { verified: false }
// ─────────────────────────────────────────
app.post('/api/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment fields.' });
    }

    // Build the HMAC-SHA256 digest exactly as Razorpay prescribes
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
        .createHmac('sha256', KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expected === razorpay_signature) {
        // ✅ Payment is genuine
        // 👉 TODO: Here you would:
        //    - Save the order to your database
        //    - Send the PDF to the customer's email (using Nodemailer / SendGrid)
        //    - Mark the order as fulfilled

        console.log(`✅ Payment verified: ${razorpay_payment_id} for order ${razorpay_order_id}`);
        res.json({ verified: true, paymentId: razorpay_payment_id });
    } else {
        // ❌ Signature mismatch — do NOT fulfil the order
        console.warn(`❌ Signature mismatch for order ${razorpay_order_id}`);
        res.status(400).json({ verified: false, error: 'Signature verification failed.' });
    }
});

// ─────────────────────────────────────────
//  Start server
// ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`PreVisit server running at http://localhost:${PORT}`);
    console.log(`Using Razorpay key: ${KEY_ID}`);
});