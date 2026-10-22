const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a menu item name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  /* Monetary value in Iranian Toman (application convention 'IRT' —
     not an ISO 4217 code). Stored as a plain number; the currency
     label is a display-only concern in the frontend. */
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please provide a category']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  preparationTime: {
    type: Number
  },
  allergens: [{
    type: String
  }],
  /* Admin-defined attributes/badges assigned to this item (see
     models/ProductAttribute.js). Refs are validated against the owner
     on create/update and cleaned up when an attribute is deleted. */
  attributes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductAttribute'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);