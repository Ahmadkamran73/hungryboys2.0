const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const axios = require('axios');
const dotenv = require('dotenv'); // Import dotenv to load environment variables
const credentials = require('./credentials.json');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Google Sheets Authentication
const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Get reCAPTCHA secret key from environment variables
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY; // Access the secret key from .env

// Root route
app.get('/', (req, res) => {
  res.send('Hello, this is the backend server!');
});

// /submit-order route
app.post('/submit-order', async (req, res) => {
  const order = req.body;
  const recaptchaToken = order.recaptchaToken; // Extract reCAPTCHA token from request body

  // Step 1: Verify the reCAPTCHA token
  try {
    const recaptchaVerificationResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY, // Use secret key from environment variable
          response: recaptchaToken,
        },
      }
    );

    if (!recaptchaVerificationResponse.data.success) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed' });
    }

    // Step 2: Proceed with order processing if reCAPTCHA is successful
    const orderData = [
      [
        order.firstName || '',
        order.lastName || '',
        order.room || '',
        order.phone || '',
        order.email || '',
        order.persons || '',
        order.deliveryCharge || '',
        order.itemTotal || '',
        order.grandTotal || '',
        order.cartItems || '',  // Assuming frontend sends cartItems as a string
        new Date().toLocaleString('en-PK', {
          timeZone: 'Asia/Karachi',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        order.accountTitle || '',
        order.bankName || '',
        order.screenshotURL || '',
        order.specialInstructions || '',  // ✅ NEW FIELD ADDED HERE
      ],
    ];

    // Step 3: Add the order data to the Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: '19XmKUHo3RPAZReFbA4Sfr0G48y1KIFvkFGeVm8xYQpA',
      range: 'orders!A2',
      valueInputOption: 'RAW',
      resource: { values: orderData },
    });

    // Step 4: Respond to the client
    res.status(200).json({ message: 'Order submitted successfully!' });

  } catch (err) {
    console.error('❌ Failed to submit order:', err.response?.data || err);
    res.status(500).json({ error: 'Failed to submit order to Google Sheets' });
  }
});

// Start the server
app.listen(5000, () => {
  console.log('✅ Server is running on http://localhost:5000');
});