const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

/* ── Roles ──────────────────────────────────────────────────────────
   super_admin      — platform owner: manages accounts across the
                      whole platform (provisioned only via the
                      offline `npm run super-admin` script).
   restaurant_admin — the ordinary restaurant owner/admin (default);
                      manages only their own restaurant, exactly as
                      before this feature existed.
   The role is ALWAYS read from the database by the auth middleware —
   it is never taken from the JWT payload or any client-submitted
   field, so it cannot be escalated through token manipulation or
   mass assignment.
──────────────────────────────────────────────────────────────────── */
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  RESTAURANT_ADMIN: 'restaurant_admin',
};

/* Per-restaurant (per-tenant) branding configuration.
   There is no separate Restaurant collection in this app — the owner User
   document IS the tenant (all menu data references `owner`), so branding
   lives here. Defaults match the existing app palette; documents created
   before this schema existed simply have no stored values and are served
   through the default-merging helper in utils/branding.js (no migration). */
const brandingSchema = new mongoose.Schema(
  {
    logo: {
      type: String,
      default: '',
      trim: true
    },
    primaryColor: {
      type: String,
      default: '#8B1A1A',
      match: [HEX_COLOR, 'Invalid hex color']
    },
    primaryHoverColor: {
      type: String,
      default: '#A82020',
      match: [HEX_COLOR, 'Invalid hex color']
    },
    secondaryColor: {
      type: String,
      default: '#C9A84C',
      match: [HEX_COLOR, 'Invalid hex color']
    },
    accentColor: {
      type: String,
      default: '#C9A84C',
      match: [HEX_COLOR, 'Invalid hex color']
    },
    backgroundColor: {
      type: String,
      default: '#FDF6EC',
      match: [HEX_COLOR, 'Invalid hex color']
    },
    surfaceColor: {
      type: String,
      default: '#FFFFFF',
      match: [HEX_COLOR, 'Invalid hex color']
    },
    primaryTextColor: {
      type: String,
      default: '#2C1A0E',
      match: [HEX_COLOR, 'Invalid hex color']
    },
    secondaryTextColor: {
      type: String,
      default: '#8C7B6B',
      match: [HEX_COLOR, 'Invalid hex color']
    },
    primaryDarkColor: {
      type: String,
      default: '#5C0E0E',
      match: [HEX_COLOR, 'Invalid hex color']
    },
    primaryPaleColor: {
      type: String,
      default: '#FBEAEA',
      match: [HEX_COLOR, 'Invalid hex color']
    }
  },
  { _id: false }
);

/* Bilingual (fa/en) customer-facing menu content — heading, tagline,
   CTAs, etc. for the public QR menu. Fields a restaurant never fills
   in stay empty and fall back to the app's default translations on
   the client, so no migration is needed for existing documents. */
const localizedTextSchema = new mongoose.Schema(
  {
    fa: { type: String, trim: true, maxlength: 600, default: '' },
    en: { type: String, trim: true, maxlength: 600, default: '' }
  },
  { _id: false }
);

const menuContentSchema = new mongoose.Schema(
  {
    heading: { type: localizedTextSchema, default: () => ({}) },
    tagline: { type: localizedTextSchema, default: () => ({}) },
    subtitle: { type: localizedTextSchema, default: () => ({}) },
    description: { type: localizedTextSchema, default: () => ({}) },
    instructions: { type: localizedTextSchema, default: () => ({}) },
    menuButtonLabel: { type: localizedTextSchema, default: () => ({}) },
    orderButtonLabel: { type: localizedTextSchema, default: () => ({}) }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  /* Platform role. Existing documents predate this field and are read
     through `role || 'restaurant_admin'` fallbacks where it matters,
     while the schema default applies to every newly created user. */
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.RESTAURANT_ADMIN
  },
  /* Required for restaurant tenants (it names the restaurant); the
     platform-level super admin has no restaurant of their own. */
  restaurantName: {
    type: String,
    trim: true,
    default: '',
    required: [
      function () {
        return this.role !== ROLES.SUPER_ADMIN;
      },
      'Please provide a restaurant name'
    ]
  },
  /* Account status. Legacy documents predate this field — they are
     treated as active (`isActive !== false`); only an explicit false
     disables an account. */
  isActive: {
    type: Boolean,
    default: true
  },
  branding: {
    type: brandingSchema,
    default: () => ({})
  },
  /* Per-restaurant customer-facing text (see utils/menuContent.js) */
  menuContent: {
    type: menuContentSchema,
    default: () => ({})
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    /* Must RETURN here: falling through would try to hash an
       undefined password on every unrelated save (branding updates,
       super-admin edits of existing users, …). */
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getSignedJwtToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const User = mongoose.model('User', userSchema);
User.ROLES = ROLES;

module.exports = User;
