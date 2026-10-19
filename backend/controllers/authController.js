const User = require('../models/User');

/* Public self-registration has been REMOVED. Accounts are created
   only by the Super Admin through POST /api/super-admin/users
   (protected), or by provisioning the first Super Admin offline via
   `npm run super-admin`. The old route is kept as an explicit 403 so
   any lingering client or script gets a clear, non-enumerating
   answer instead of a silent 404. */
const registrationDisabled = (req, res) => {
  res.status(403).json({
    message: 'Public registration is disabled. Contact the platform administrator to create an account.'
  });
};

/* Sanitized shape returned to the client — never includes the
   password (or hash), branding internals, or anything else. */
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  restaurantName: user.restaurantName,
  role: user.role || 'restaurant_admin',
  isActive: user.isActive !== false
});

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    /* Disabled accounts cannot obtain a session even with correct
       credentials. The same generic message avoids confirming that
       the account exists. */
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: toPublicUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    /* req.user was loaded (and active-checked) by the auth middleware */
    res.status(200).json({
      success: true,
      user: toPublicUser(req.user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registrationDisabled,
  login,
  getMe,
  toPublicUser
};
