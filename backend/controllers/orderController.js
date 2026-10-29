const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');

const createOrder = async (req, res) => {
  try {
    const { tableNumber, ownerId, items, customerNote } = req.body;

    if (!tableNumber || !ownerId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Please provide table number, owner ID, and at least one item' });
    }

    const table = await Table.findOne({ tableNumber: parseInt(tableNumber), owner: ownerId });

    let orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (menuItem) {
        orderItems.push({
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity
        });
        totalAmount += menuItem.price * item.quantity;
      }
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ message: 'No valid items found' });
    }

    const order = await Order.create({
      tableNumber: parseInt(tableNumber),
      tableId: table ? table._id : null,
      items: orderItems,
      totalAmount,
      customerNote,
      owner: ownerId
    });

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    /* A malformed id never reaches Mongo — it would surface as a
       CastError (HTTP 500). Reject it as a client error instead. */
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = await Order.find({
      owner: req.user.id,
      createdAt: { $gte: today }
    });

    const totalOrdersToday = ordersToday.length;
    const totalRevenueToday = ordersToday.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingOrders = await Order.countDocuments({
      owner: req.user.id,
      status: 'pending'
    });

    const menuItemsCount = await MenuItem.countDocuments({ owner: req.user.id });

    res.status(200).json({
      success: true,
      stats: {
        totalOrdersToday,
        totalRevenueToday,
        pendingOrders,
        menuItemsCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  getDashboardStats
};