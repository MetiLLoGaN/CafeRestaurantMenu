const User = require('../models/User');
const {
  sanitizeMenuContent,
  getEffectiveMenuContent
} = require('../utils/menuContent');

/* ────────────────────────────────────────────────────────────────
   GET /api/menu-content — the authenticated restaurant's saved
   customer-facing content. Scoped to req.user.id, so one tenant
   can never read or edit another's content.
──────────────────────────────────────────────────────────────── */
const getMenuContent = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      menuContent: getEffectiveMenuContent(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────
   PUT /api/menu-content — update customer-facing content.
   Body: { <field>: { fa: '…', en: '…' }, … } (any subset).
   Only whitelisted fields/languages are stored; empty strings clear
   an override so the default translation shows again.
──────────────────────────────────────────────────────────────── */
const updateMenuContent = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { values, invalid } = sanitizeMenuContent(req.body || {});

    if (invalid.length > 0) {
      return res.status(400).json({
        message: `Invalid value for: ${invalid.join(', ')}`,
        fields: invalid
      });
    }

    const current =
      user.menuContent && typeof user.menuContent.toObject === 'function'
        ? user.menuContent.toObject()
        : user.menuContent || {};

    /* Merge the validated subset over what is already stored */
    user.menuContent = { ...current, ...values };
    await user.save();

    res.status(200).json({
      success: true,
      menuContent: getEffectiveMenuContent(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMenuContent,
  updateMenuContent
};
