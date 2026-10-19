require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

/* ══════════════════════════════════════════════════════════════════
   Super Admin provisioning (one-time, offline).

   The ONLY way the first super admin account comes into existence —
   there is no API endpoint that grants super admin privileges.

   Usage:
     1. Set in backend/.env (never commit real values):
          SUPER_ADMIN_NAME=Platform Owner
          SUPER_ADMIN_EMAIL=superadmin@yourdomain.com
          SUPER_ADMIN_PASSWORD=<strong random password>
     2. Run:  npm run super-admin

   Safe to rerun:
     • If the email already belongs to a super admin, nothing is
       changed (the existing password is NEVER reset).
     • If the email belongs to an existing restaurant account, the
       script refuses to touch it and exits with an error.
   The password is hashed by the User model's pre('save') hook and
   is never printed or transmitted.
══════════════════════════════════════════════════════════════════ */

const name = (process.env.SUPER_ADMIN_NAME || '').trim();
const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD || '';

const provision = async () => {
  if (!name || !email || !password) {
    console.error('❌ Missing SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD.');
    console.error('   Set them in backend/.env (see backend/.env.example), then rerun.');
    process.exit(1);
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    console.error('❌ SUPER_ADMIN_EMAIL is not a valid email address.');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ SUPER_ADMIN_PASSWORD must be at least 6 characters.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for provisioning');

    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role === User.ROLES.SUPER_ADMIN) {
        console.log('ℹ️  A super admin with this email already exists. Nothing was changed.');
        console.log('   (This script never resets an existing password.)');
        await mongoose.connection.close();
        process.exit(0);
      }

      console.error('❌ That email already belongs to an existing restaurant account.');
      console.error('   Refusing to overwrite it. Use a different SUPER_ADMIN_EMAIL.');
      await mongoose.connection.close();
      process.exit(1);
    }

    const user = await User.create({
      name,
      email,
      password, // plain text here — hashed exactly once by the model hook
      role: User.ROLES.SUPER_ADMIN,
      restaurantName: '' // super admins have no restaurant tenant
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Super Admin provisioned successfully');
    console.log('   Email:', user.email);
    console.log('   Log in at: /admin/login → you will land on /super-admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Provisioning error:', error.message);
    process.exit(1);
  }
};

provision();
