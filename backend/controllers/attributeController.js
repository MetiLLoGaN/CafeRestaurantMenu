const ProductAttribute = require('../models/ProductAttribute');
const MenuItem = require('../models/MenuItem');
const { normalizeHex } = require('../utils/branding');

/* ══════════════════════════════════════════════════════════════════
   PRODUCT ATTRIBUTES — CRUD for admin-defined badges/tags.

   Every handler is scoped to req.user.id (tenant isolation), the same
   convention as /api/branding and /api/menu-content: an admin can only
   ever list, edit or delete their own attributes.
══════════════════════════════════════════════════════════════════ */

const MAX_NAME_LENGTH = 40;

const cleanName = (value) =>
  typeof value === 'string' ? value.trim().slice(0, MAX_NAME_LENGTH) : '';

/* Normalize the two supported fields of an incoming payload.
   Returns { name, color, isActive, invalid }. */
const readPayload = (body = {}) => {
  const invalid = [];

  const rawName =
    body.name && typeof body.name === 'object' && !Array.isArray(body.name)
      ? body.name
      : {};

  const name = {
    fa: cleanName(rawName.fa),
    en: cleanName(rawName.en)
  };

  /* At least one language must carry a label */
  if (!name.fa && !name.en) invalid.push('name');

  let color = '';
  if (body.color !== undefined && body.color !== null && body.color !== '') {
    const normalized = normalizeHex(body.color);
    if (normalized) color = normalized;
    else invalid.push('color');
  }

  const isActive =
    body.isActive === undefined ? undefined : Boolean(body.isActive);

  return { name, color, isActive, invalid };
};

/* Attributes with the same label in the same language are confusing in
   the picker, so duplicates are rejected per tenant (case-insensitive). */
const findDuplicate = async (ownerId, name, excludeId) => {
  const existing = await ProductAttribute.find({ owner: ownerId });
  for (const attr of existing) {
    if (excludeId && attr._id.toString() === excludeId) continue;
    for (const lang of ['fa', 'en']) {
      const mine = name[lang];
      const theirs = (attr.name && attr.name[lang]) || '';
      if (mine && theirs && mine.toLowerCase() === theirs.toLowerCase()) {
        return lang;
      }
    }
  }
  return null;
};

const listAttributes = async (req, res) => {
  try {
    const attributes = await ProductAttribute.find({ owner: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, attributes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createAttribute = async (req, res) => {
  try {
    const { name, color, isActive, invalid } = readPayload(req.body || {});

    if (invalid.length > 0) {
      return res.status(400).json({
        message: `Invalid value for: ${invalid.join(', ')}`,
        fields: invalid
      });
    }

    const duplicate = await findDuplicate(req.user.id, name);
    if (duplicate) {
      return res.status(409).json({
        message: 'An attribute with this name already exists',
        fields: [`name.${duplicate}`]
      });
    }

    const attribute = await ProductAttribute.create({
      owner: req.user.id,
      name,
      color,
      isActive: isActive === undefined ? true : isActive
    });

    res.status(201).json({ success: true, attribute });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateAttribute = async (req, res) => {
  try {
    const attribute = await ProductAttribute.findById(req.params.id);

    if (!attribute) {
      return res.status(404).json({ message: 'Attribute not found' });
    }

    if (attribute.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this attribute' });
    }

    const { name, color, isActive, invalid } = readPayload(req.body || {});

    if (invalid.length > 0) {
      return res.status(400).json({
        message: `Invalid value for: ${invalid.join(', ')}`,
        fields: invalid
      });
    }

    const duplicate = await findDuplicate(req.user.id, name, req.params.id);
    if (duplicate) {
      return res.status(409).json({
        message: 'An attribute with this name already exists',
        fields: [`name.${duplicate}`]
      });
    }

    attribute.name = name;
    attribute.color = color;
    if (isActive !== undefined) attribute.isActive = isActive;
    await attribute.save();

    res.status(200).json({ success: true, attribute });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* Deleting an attribute also unassigns it from the owner's menu items,
   so no document is ever left with a dangling reference. */
const deleteAttribute = async (req, res) => {
  try {
    const attribute = await ProductAttribute.findById(req.params.id);

    if (!attribute) {
      return res.status(404).json({ message: 'Attribute not found' });
    }

    if (attribute.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this attribute' });
    }

    await MenuItem.updateMany(
      { owner: req.user.id, attributes: attribute._id },
      { $pull: { attributes: attribute._id } }
    );

    await attribute.deleteOne();

    res.status(200).json({ success: true, message: 'Attribute deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  listAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute
};
