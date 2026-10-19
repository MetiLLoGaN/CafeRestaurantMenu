const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: [true, 'Please provide a table number']
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    name: {
      type: String,
      required: true
    },
    /* Price snapshot at order time, in Iranian Toman */
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  /* Order total in Iranian Toman — computed server-side from the
     stored item prices; historical values are never rewritten. */
  totalAmount: {
    type: Number,
    required: [true, 'Please provide a total amount'],
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  customerNote: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);