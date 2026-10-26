const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const Product = require('./models/Product');
const User = require('./models/User'); // Import the User model

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files from the root directory
app.use(express.static(path.join(__dirname)));
// Serve index.html as the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- PRODUCT API ROUTES ---

// 1. Get All Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Add a New Product (Admin Portal)
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Update an Existing Product (Admin Portal)
app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Delete a Product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USER API ROUTES ---

// 1. Register / Sync User on Login
app.post('/api/users', async (req, res) => {
  try {
    const { email, name, provider, signedUpAt } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name, provider, signedUpAt });
      await user.save();
    } else {
      user.name = name || user.name;
      await user.save();
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Users for Admin Portal
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ signedUpAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DATABASE CONNECTION & SERVER START ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb+srv://traviacafe_db_user:f5JgmO8wOkRgWA7H@cluster0.r6rceyu.mongodb.net/maison_de_cess?retryWrites=true&w=majority';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Database successfully!');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });
