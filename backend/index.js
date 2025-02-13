// index.js

const express = require('express');
const cors = require('cors');
const { checkProductStatus } = require('./productStatus'); // Import the checkProductStatus function

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS if your React app is hosted on a different origin
app.use(cors());

// Middleware to parse JSON bodies in requests
app.use(express.json());

// OBW Compliance Endpoint
// Example: GET /api/obw-compliance?upc=00127578
// This endpoint is used when a user scans a barcode (UPC). The endpoint returns
// detailed product compliance info (including domino counts, replenishment scan info, etc.)
app.get('/api/obw-compliance', async (req, res) => {
  const upc = req.query.upc;
  if (!upc) {
    return res.status(400).json({ status: 'error', message: 'Missing upc query parameter' });
  }

  try {
    const result = await checkProductStatus(upc);
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error("Error in /api/obw-compliance:", error.message);
    res.status(500).json({
      status: 'error',
      message: 'Could not check product status for OBW compliance.'
    });
  }
});

// Other endpoints (for ambient checker, location checker, etc.) can remain here...
app.get('/api/ambient-checker', (req, res) => {
  res.json({
    status: 'success',
    data: {
      message: 'Ambient Checker data'
    }
  });
});

app.get('/api/location-checker', (req, res) => {
  res.json({
    status: 'success',
    data: {
      message: 'Location Checker data'
    }
  });
});

// A sample POST endpoint to handle incoming data
app.post('/api/data', (req, res) => {
  const incomingData = req.body;
  res.status(200).json({
    status: 'success',
    received: incomingData
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
