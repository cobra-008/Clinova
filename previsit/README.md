# PreVisit — Setup Guide

## Folder Structure
```
previsit/
├── public/
│   ├── index.html      ← Landing page (http://localhost:3000)
│   └── checkout.html   ← Payment page (http://localhost:3000/checkout.html)
├── server.js           ← Backend (Node.js + Express)
├── package.json
├── .env                ← YOUR KEYS (create this, never share it)
└── .env.example        ← Template
```

---

## Run Locally (Step by Step)

### 1. Install Node.js
Download from https://nodejs.org (LTS version) if you don't have it.
Verify: `node -v` should print a version number.

### 2. Install dependencies
Open Terminal in the `previsit/` folder and run:
```bash
npm install
```

### 3. Add your Razorpay test keys
Copy the example file:
```bash
cp .env.example .env
```
Then open `.env` and replace the placeholders:
```
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
RAZORPAY_KEY_SECRET=your_actual_key_secret
```
Get your test keys from: https://dashboard.razorpay.com → Settings → API Keys

### 4. Start the server
```bash
node server.js
```
You should see:
```
🚀 PreVisit server running at http://localhost:3000
   Using Razorpay key: rzp_test_...
```

### 5. Test it
- Open http://localhost:3000 → landing page
- Click the "Get PreVisit" button → goes to checkout.html
- Fill the form and pay using Razorpay test cards:
  - Card: `4111 1111 1111 1111` | Expiry: any future date | CVV: any 3 digits
  - Or UPI: `success@razorpay`

---

## Deploy to Vercel

Vercel is primarily for frontend. For a Node.js backend, use one of:
- **Railway** (easiest): https://railway.app — drag and drop, done
- **Render**: https://render.com — free tier available
- **Vercel** (with config): Add a `vercel.json`:

```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```
Then set your env vars in the Vercel dashboard under Project → Settings → Environment Variables.

After deploying, update this line in `public/checkout.html`:
```js
const SERVER_BASE = 'https://your-deployed-url.vercel.app';
```

---

## Test Cards (Razorpay Test Mode)
| Method | Details |
|--------|---------|
| Visa card | `4111 1111 1111 1111` · any future expiry · any CVV |
| Mastercard | `5500 6700 0000 1002` |
| UPI | `success@razorpay` (success) / `failure@razorpay` (failure) |
| Netbanking | Select any bank → click Success on mock page |
