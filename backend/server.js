require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tableRoutes = require('./routes/tableRoutes');
const brandingRoutes = require('./routes/brandingRoutes');
const menuContentRoutes = require('./routes/menuContentRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

/* Serve uploaded menu item images */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/menu-content', menuContentRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/super-admin', superAdminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'QR Menu System API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});