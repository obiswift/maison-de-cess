const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  provider: { type: String },
  signedUpAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
