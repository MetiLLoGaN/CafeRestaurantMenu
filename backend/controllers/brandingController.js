const User = require('../models/User');
const {
  DEFAULT_BRANDING,
  validateBrandingColors,
  getEffectiveBranding
} = require('../utils/branding');
const { removeLogoImage } = require('../middleware/imageUpload');

/* ────────────────────────────────────────────────────────────────
   GET /api/branding — the authenticated restaurant's branding.
   Scoped to req.user.id: one tenant can never read another's
   settings through this route (they only ever see their own).
──────────────────────────────────────────────────────────────── */
const getBranding = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      restaurantName: user.restaurantName,
      branding: getEffectiveBranding(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────
   PUT /api/branding — update colors.
   Body: { primaryColor: '#…', … } (any subset) or { reset: true }
   to restore the default palette. `logo` in the body is ignored —
   the logo can only change through the upload/delete endpoints.
──────────────────────────────────────────────────────────────── */
const updateBranding = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const current = getEffectiveBranding(user);
    let next;

    if (req.body && req.body.reset === true) {
      /* Reset restores the default palette but keeps a custom logo —
         removing branding colors must never delete brand imagery. */
      next = { ...DEFAULT_BRANDING, logo: current.logo };
    } else {
      const { values, invalid } = validateBrandingColors(req.body || {});

      if (invalid.length > 0) {
        return res.status(400).json({
          message: `Invalid color value for: ${invalid.join(', ')}`,
          fields: invalid
        });
      }

      next = { ...current, ...values };
    }

    user.branding = next;
    await user.save();

    res.status(200).json({
      success: true,
      branding: getEffectiveBranding(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────
   POST /api/branding/logo — upload / replace the restaurant logo.
   The file was already stored under a server-generated
   `logo-<ownerId>-…` name by the logoUpload middleware and passed
   magic-byte validation. This handler only ever writes into THIS
   user's branding and only ever unlinks THIS owner's previous logo
   file, so tenants cannot clobber each other.
──────────────────────────────────────────────────────────────── */
const uploadLogo = async (req, res) => {
  const newUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const discardUpload = () => {
    if (newUrl) removeLogoImage(newUrl, req.user.id);
  };

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please provide a logo file' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      discardUpload();
      return res.status(404).json({ message: 'User not found' });
    }

    const previousLogo = getEffectiveBranding(user).logo;
    user.branding = { ...getEffectiveBranding(user), logo: newUrl };

    try {
      await user.save();
    } catch (saveError) {
      /* Don't leave an orphaned file behind if the DB write failed. */
      discardUpload();
      throw saveError;
    }

    /* Replace: remove the previous file only if it is this owner's logo.
       Menu item images and other tenants' files are never touched. */
    if (previousLogo && previousLogo !== newUrl) {
      removeLogoImage(previousLogo, req.user.id);
    }

    res.status(200).json({
      success: true,
      branding: getEffectiveBranding(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────
   DELETE /api/branding/logo — drop the custom logo (falls back to
   the default brand mark). The stored file is removed only when it
   matches this owner's `logo-<ownerId>-` prefix.
──────────────────────────────────────────────────────────────── */
const deleteLogo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const previousLogo = getEffectiveBranding(user).logo;
    user.branding = { ...getEffectiveBranding(user), logo: '' };
    await user.save();

    if (previousLogo) {
      removeLogoImage(previousLogo, req.user.id);
    }

    res.status(200).json({
      success: true,
      branding: getEffectiveBranding(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getBranding,
  updateBranding,
  uploadLogo,
  deleteLogo
};
