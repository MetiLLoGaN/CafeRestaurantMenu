const mongoose = require('mongoose');
const User = require('../models/User');

/* ────────────────────────────────────────────────────────────────
   Super Admin controller — platform-wide account management.

   Every handler here runs behind `auth` + `requireSuperAdmin`
   (see routes/superAdminRoutes.js), so `req.user` is a database-
   loaded, active super admin. All input is picked field-by-field
   (never `…req.body`), which blocks mass assignment / role
   escalation through manipulated request bodies. Responses never
   include the password field (it is `select: false` in the schema
   and additionally stripped by `serializeUser`).
──────────────────────────────────────────────────────────────── */

const ROLES = Object.values(User.ROLES);

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* Public, secret-free projection for list queries */
const USER_PROJECTION = 'name email restaurantName role isActive createdAt';

/* Shape every response takes — password/hash can never leak. */
const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  restaurantName: user.restaurantName,
  role: user.role || User.ROLES.RESTAURANT_ADMIN,
  /* Legacy documents predate the field: treat missing as active */
  isActive: user.isActive !== false,
  createdAt: user.createdAt
});

/* ── GET /api/super-admin/stats ──────────────────────────────────
   Aggregates only what the database actually contains — no
   fabricated metrics. "Restaurant accounts" = restaurant admins,
   since each restaurant tenant in this app is an owner User. */
const getStats = async (req, res) => {
  try {
    const activeFilter = { isActive: { $ne: false } };

    const [totalUsers, totalRestaurantAdmins, totalSuperAdmins, activeUsers, disabledUsers] =
      await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ role: User.ROLES.RESTAURANT_ADMIN }),
        User.countDocuments({ role: User.ROLES.SUPER_ADMIN }),
        User.countDocuments(activeFilter),
        User.countDocuments({ isActive: false })
      ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        /* Each restaurant admin account owns one restaurant tenant */
        totalRestaurants: totalRestaurantAdmins,
        totalSuperAdmins,
        activeUsers,
        disabledUsers
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/* ── GET /api/super-admin/users?search=&role=&status=&page=&limit= */
const listUsers = async (req, res) => {
  try {
    const filter = {};

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    if (req.query.role) {
      if (!ROLES.includes(req.query.role)) {
        return res.status(400).json({ message: 'Invalid role filter' });
      }
      filter.role = req.query.role;
    }

    if (req.query.status === 'active') {
      filter.isActive = { $ne: false };
    } else if (req.query.status === 'disabled') {
      filter.isActive = false;
    } else if (req.query.status !== undefined && req.query.status !== '') {
      return res.status(400).json({ message: 'Invalid status filter' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(USER_PROJECTION)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      users: users.map(serializeUser),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(Math.ceil(total / limit), 1)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/* ── POST /api/super-admin/users ─────────────────────────────────
   Create an account (restaurant admin or — platform-wide only from
   here — another super admin). Only this protected route can create
   a super admin; the old public /api/auth/register is a hard 403. */
const createUser = async (req, res) => {
  try {
    /* Explicit allow-list — never mass assignment */
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const role = req.body.role || User.ROLES.RESTAURANT_ADMIN;
    const restaurantName =
      typeof req.body.restaurantName === 'string' ? req.body.restaurantName.trim() : '';
    const isActive = req.body.isActive === undefined ? true : req.body.isActive === true;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a name' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (role === User.ROLES.RESTAURANT_ADMIN && !restaurantName) {
      return res.status(400).json({ message: 'Restaurant name is required for a restaurant admin' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    /* Password is hashed exactly once by the User model's pre('save')
       hook — never stored, echoed or logged in plain text here. */
    const user = await User.create({
      name,
      email,
      password,
      role,
      restaurantName: role === User.ROLES.SUPER_ADMIN ? restaurantName : restaurantName,
      isActive
    });

    res.status(201).json({ success: true, user: serializeUser(user) });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }
    if (error && error.name === 'ValidationError') {
      const first = Object.values(error.errors || {})[0];
      return res.status(400).json({ message: first ? first.message : 'Invalid data' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

/* ── PUT /api/super-admin/users/:id ──────────────────────────────
   Update name / email / restaurant / role / status. Password is
   deliberately NOT accepted here — it has its own reset endpoint. */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSelf = String(user._id) === String(req.user.id);

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      user.name = req.body.name.trim();
    }

    if (req.body.email !== undefined) {
      if (typeof req.body.email !== 'string' || !/^\S+@\S+\.\S+$/.test(req.body.email.trim())) {
        return res.status(400).json({ message: 'Please provide a valid email' });
      }
      const email = req.body.email.trim().toLowerCase();
      const duplicate = await User.findOne({ email, _id: { $ne: user._id } });
      if (duplicate) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }
      user.email = email;
    }

    if (req.body.restaurantName !== undefined) {
      if (typeof req.body.restaurantName !== 'string') {
        return res.status(400).json({ message: 'Invalid restaurant name' });
      }
      user.restaurantName = req.body.restaurantName.trim();
    }

    if (req.body.role !== undefined) {
      if (!ROLES.includes(req.body.role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      /* A super admin may never demote their own account — this
         guarantees the platform can never lock itself out. */
      if (isSelf && req.body.role !== User.ROLES.SUPER_ADMIN) {
        return res.status(400).json({ message: 'You cannot change your own role' });
      }
      user.role = req.body.role;
    }

    if (req.body.isActive !== undefined) {
      const nextActive = req.body.isActive === true;
      if (isSelf && !nextActive) {
        return res.status(400).json({ message: 'You cannot disable your own account' });
      }
      user.isActive = nextActive;
    }

    if (user.role !== User.ROLES.SUPER_ADMIN && !user.restaurantName) {
      return res.status(400).json({ message: 'Restaurant name is required for a restaurant admin' });
    }

    try {
      await user.save();
    } catch (saveError) {
      if (saveError && saveError.name === 'ValidationError') {
        const first = Object.values(saveError.errors || {})[0];
        return res.status(400).json({ message: first ? first.message : 'Invalid data' });
      }
      throw saveError;
    }

    res.status(200).json({ success: true, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/* ── PUT /api/super-admin/users/:id/password ─────────────────────
   Secure password reset. Plain text arrives only in this request
   body, is hashed once by the model's pre('save') hook, and is
   never returned or logged. */
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    /* Assign the plain password; the pre('save') hook hashes it */
    user.password = password;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStats,
  listUsers,
  createUser,
  updateUser,
  resetPassword
};
