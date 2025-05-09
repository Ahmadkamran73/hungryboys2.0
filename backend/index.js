const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// ✅ Allow CORS only for specific origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://www.hungryboys.live'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(bodyParser.json());

// ✅ Load credentials from base64-encoded environment variable
const credentialsJSON = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8');
const credentials = JSON.parse(credentialsJSON);

// ✅ Authenticate with Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ✅ Root route
app.get('/', (req, res) => {
  res.send('✅ Google Sheets API backend is running!');
});

// ✅ Submit order endpoint
app.post('/submit-order', async (req, res) => {
  const order = req.body;
  const recaptchaToken = order.recaptchaToken;

  try {
    // 1. Verify reCAPTCHA
    const recaptchaResponse = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        },
      }
    );

    if (!recaptchaResponse.data.success) {
      return res.status(400).json({ error: '❌ reCAPTCHA verification failed' });
    }

    // 2. Prepare data for Google Sheets
    const orderData = [[
      order.firstName || '',
      order.lastName || '',
      order.room || '',
      order.phone || '',
      order.email || '',
      order.persons || '',
      order.deliveryCharge || '',
      order.itemTotal || '',
      order.grandTotal || '',
      order.cartItems || '',
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
      order.specialInstruction || '',
    ]];

    // 3. Append to the Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'orders!A2',
      valueInputOption: 'RAW',
      resource: {
        values: orderData,
      },
    });

    res.status(200).json({ message: '✅ Order submitted successfully!' });
  } catch (error) {
    console.error('❌ Error submitting order:', error.response?.data || error.message);
    res.status(500).json({ error: '❌ Failed to submit order to Google Sheets' });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
