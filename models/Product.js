const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true }, // Retail Price in KSh
  wholesalePrice: { type: Number, required: true }, // Wholesale Price in KSh
  stock: { type: Number, required: true, default: 0 },
  colors: { type: String, default: '' }, // Allows truly blank values
  image: { type: String, required: true }, // Image URL or Cloudinary path
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
