const jwt = require('jsonwebtoken');
const User = require('../models/User');

/* ────────────────────────────────────────────────────────────────
   auth — the single authentication gate for the whole API.
   • Verifies the JWT and loads the user FROM THE DATABASE, so
     `req.user.role` / `req.user.isActive` are trusted server-side
     state — never client claims.
   • Disabled accounts (`isActive === false`) lose access to every
     protected endpoint immediately, regardless of token validity.
     Legacy documents predate the field and count as active.
──────────────────────────────────────────────────────────────── */
const auth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    if (req.user.isActive === false) {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/* ────────────────────────────────────────────────────────────────
   requireSuperAdmin — platform-level authorization.
   Must run AFTER `auth`. Checks the persisted role loaded from
   MongoDB; a client-submitted role, user id or restaurant id is
   never consulted.
──────────────────────────────────────────────────────────────── */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== User.ROLES.SUPER_ADMIN) {
    return res.status(403).json({ message: 'Super administrator access required' });
  }
  next();
};

module.exports = auth;
module.exports.requireSuperAdmin = requireSuperAdmin;
