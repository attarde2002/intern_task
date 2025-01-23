// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/portfolioTracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define Mongoose schema and model
const holdingSchema = new mongoose.Schema({
  ticker: String,
  quantity: Number,
  purchasePrice: Number,
}, { timestamps: true });

const Holding = mongoose.model('Holding', holdingSchema);

// Routes

// Add a stock holding
app.post('/holdings', async (req, res) => {
  try {
    const { ticker, quantity, purchasePrice } = req.body;
    const holding = new Holding({ ticker, quantity, purchasePrice });
    await holding.save();
    res.status(201).json(holding);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add holding' });
  }
});

// Get all holdings
app.get('/holdings', async (req, res) => {
  try {
    const holdings = await Holding.find();
    res.status(200).json(holdings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch holdings' });
  }
});

// Edit a holding
app.put('/holdings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const holding = await Holding.findByIdAndUpdate(id, updatedData, { new: true });
    res.status(200).json(holding);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update holding' });
  }
});

// Delete a holding
app.delete('/holdings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Holding.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete holding' });
  }
});

// Fetch real-time stock prices
const API_KEY = 'your_stock_api_key'; // Replace with your stock API key
app.get('/prices', async (req, res) => {
  try {
    const holdings = await Holding.find();
    const prices = await Promise.all(holdings.map(async (holding) => {
      const { ticker } = holding;
      const response = await axios.get(`https://api.example.com/stock/${ticker}?apikey=${API_KEY}`); // Replace with a real API endpoint
      return {
        ticker,
        currentPrice: response.data.price, // Adjust based on API response format
        quantity: holding.quantity,
        totalValue: response.data.price * holding.quantity,
      };
    }));

    const totalPortfolioValue = prices.reduce((acc, item) => acc + item.totalValue, 0);
    res.status(200).json({ prices, totalPortfolioValue });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock prices' });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
