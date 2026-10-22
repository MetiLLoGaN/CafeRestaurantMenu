const mongoose = require('mongoose');

/* Bilingual label — same { fa, en } convention as the menuContent
   localized text in models/User.js. */
const localizedNameSchema = new mongoose.Schema(
  {
    fa: { type: String, trim: true, maxlength: 40, default: '' },
    en: { type: String, trim: true, maxlength: 40, default: '' }
  },
  { _id: false }
);

/* ══════════════════════════════════════════════════════════════════
   PRODUCT ATTRIBUTE — an admin-defined badge/tag that can be assigned
   to menu items (محبوب، گرم، سرد، ویژه، … or anything else the admin
   creates). Nothing here is hardcoded: the list is entirely per tenant
   and can be created, edited, disabled and deleted from the admin panel.

   • name   — bilingual label; at least one language is required
              (validated in the controller, not here, so legacy docs
              and partial updates stay loadable).
   • color  — optional hex badge color ('' = design-system default),
              normalized with utils/branding.js's normalizeHex.
   • isActive — a disabled attribute stays assigned to items but is
              hidden from the public menu until re-enabled.
   • owner  — tenant scoping: attributes never cross tenants.
══════════════════════════════════════════════════════════════════ */
const productAttributeSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: localizedNameSchema,
    default: () => ({})
  },
  color: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProductAttribute', productAttributeSchema);
