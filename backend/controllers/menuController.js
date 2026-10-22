const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const ProductAttribute = require('../models/ProductAttribute');
const User = require('../models/User');
const mongoose = require('mongoose');
const { removeLocalImage } = require('../middleware/imageUpload');
const { getEffectiveBranding } = require('../utils/branding');
const { getEffectiveMenuContent } = require('../utils/menuContent');

/* Prices are Iranian Toman amounts (application convention 'IRT').
   Accept only numbers or non-empty numeric strings; reject booleans,
   objects, arrays, NaN, Infinity and negatives. */
const parseTomanPrice = (value) => {
  if (typeof value === 'boolean' || value === null || typeof value === 'object') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : null;
};

/* Validate the `attributes` array a client sends with a menu item.
   Returns { ids } where `ids === undefined` means "not provided — leave
   the stored value alone", or { error } describing why the payload was
   rejected. Every id must be a real attribute owned by this tenant, so
   one restaurant can never badge its items with another's attributes. */
const resolveAttributes = async (value, ownerId) => {
  if (value === undefined) return { ids: undefined };
  if (value === null) return { ids: [] };
  if (!Array.isArray(value)) return { error: 'invalid' };

  const ids = [];
  for (const id of value) {
    if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) return { error: 'invalid' };
    if (!ids.includes(id)) ids.push(id);
  }

  const owned = await ProductAttribute.countDocuments({ _id: { $in: ids }, owner: ownerId });
  if (owned !== ids.length) return { error: 'unknown' };

  return { ids };
};

/* Public-safe view of a menu item: the attribute documents are reduced
   to their badge data (label + color, active attributes only). Owner,
   timestamps and every other attribute field stay server-side. */
const toPublicItem = (item) => {
  const plain = typeof item.toObject === 'function' ? item.toObject() : { ...item };
  plain.attributes = (Array.isArray(plain.attributes) ? plain.attributes : [])
    .filter((attr) => attr && typeof attr === 'object' && attr.isActive !== false)
    .map((attr) => ({
      _id: attr._id,
      name: {
        fa: (attr.name && attr.name.fa) || '',
        en: (attr.name && attr.name.en) || ''
      },
      color: attr.color || ''
    }));
  return plain;
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ owner: req.user.id, isActive: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a category name' });
    }

    const category = await Category.create({
      name,
      description,
      image,
      owner: req.user.id
    });

    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, isActive } = req.body;

    let category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this category' });
    }

    category = await Category.findByIdAndUpdate(id, { name, description, image, isActive }, { new: true, runValidators: true });

    res.status(200).json({
      success: true,
      category
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this category' });
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ owner: req.user.id })
      .populate('category', 'name')
      .populate('attributes')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      menuItems
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getPublicMenu = async (req, res) => {
  try {
    const { ownerId } = req.query;

    if (!ownerId) {
      return res.status(400).json({ message: 'Please provide owner ID' });
    }

    const categories = await Category.find({ owner: ownerId, isActive: true }).sort({ name: 1 });
    const menuItems = await MenuItem.find({ owner: ownerId, isAvailable: true })
      .populate('category', 'name')
      .populate('attributes')
      .sort({ name: 1 });

    /* Restaurant identity + branding + menu content for the public menu
       page. Only public-safe fields are exposed — never email. */
    const owner = await User.findById(ownerId)
      .select('restaurantName branding menuContent')
      .lean();

    const groupedMenu = categories.map(category => ({
      category: category.name,
      description: category.description,
      items: menuItems
        .filter(item => item.category._id.toString() === category._id.toString())
        .map(toPublicItem)
    }));

    res.status(200).json({
      success: true,
      restaurantName: owner ? owner.restaurantName : undefined,
      branding: owner ? getEffectiveBranding(owner) : undefined,
      menuContent: owner ? getEffectiveMenuContent(owner) : {},
      menu: groupedMenu.filter(group => group.items.length > 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image, isPopular, preparationTime, allergens, attributes } = req.body;

    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const { ids: attributeIds, error: attributeError } = await resolveAttributes(attributes, req.user.id);
    if (attributeError === 'invalid') {
      return res.status(400).json({ message: 'Attributes must be an array of attribute IDs' });
    }
    if (attributeError === 'unknown') {
      return res.status(400).json({ message: 'One or more attributes do not exist for this account' });
    }

    /* Prices are stored and processed as numeric Iranian Toman amounts
       (application convention — see README "Currency Convention").
       Reject anything that is not a finite, non-negative number. */
    const priceToman = parseTomanPrice(price);
    if (priceToman === null) {
      return res.status(400).json({ message: 'Price must be a non-negative number in Toman' });
    }

    const menuItem = await MenuItem.create({
      name,
      description,
      price: priceToman,
      category,
      image,
      owner: req.user.id,
      isPopular,
      preparationTime,
      allergens,
      attributes: attributeIds || []
    });

    await menuItem.populate('category', 'name');
    await menuItem.populate('attributes');

    res.status(201).json({
      success: true,
      menuItem
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image, isAvailable, isPopular, preparationTime, allergens, attributes } = req.body;

    let menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (menuItem.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this menu item' });
    }

    /* Validate a price update when provided: must stay a finite,
       non-negative Toman amount (no Rial/Toman conversion anywhere). */
    if (price !== undefined) {
      if (parseTomanPrice(price) === null) {
        return res.status(400).json({ message: 'Price must be a non-negative number in Toman' });
      }
    }

    /* Validate the assigned attributes when the client provides them.
       `undefined` means the payload omitted the field, so the stored
       assignment is left untouched. */
    const { ids: resolvedAttributeIds, error: attributeError } =
      await resolveAttributes(attributes, req.user.id);
    if (attributeError === 'invalid') {
      return res.status(400).json({ message: 'Attributes must be an array of attribute IDs' });
    }
    if (attributeError === 'unknown') {
      return res.status(400).json({ message: 'One or more attributes do not exist for this account' });
    }

    /* If the image URL is being changed, clean up the replaced local file */
    if (image !== undefined && image !== menuItem.image) {
      removeLocalImage(menuItem.image);
    }

    menuItem = await MenuItem.findByIdAndUpdate(id, {
      name,
      description,
      price: price !== undefined ? Number(price) : price,
      category,
      image,
      isAvailable,
      isPopular,
      preparationTime,
      allergens,
      ...(resolvedAttributeIds !== undefined
        ? { attributes: resolvedAttributeIds }
        : {})
    }, { new: true, runValidators: true }).populate('category', 'name').populate('attributes');

    res.status(200).json({
      success: true,
      menuItem
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const uploadMenuItemImage = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (menuItem.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this menu item' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please provide an image file' });
    }

    /* Store only the path in the database — the file lives in /uploads */
    const newImage = `/uploads/${req.file.filename}`;

    /* Replacing: clean up the previously stored local file */
    if (menuItem.image && menuItem.image !== newImage) {
      removeLocalImage(menuItem.image);
    }

    menuItem.image = newImage;
    await menuItem.save();

    res.status(200).json({
      success: true,
      menuItem
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const removeMenuItemImage = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (menuItem.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this menu item' });
    }

    removeLocalImage(menuItem.image);

    menuItem.image = '';
    await menuItem.save();

    res.status(200).json({
      success: true,
      menuItem
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (menuItem.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this menu item' });
    }

    /* Clean up the locally stored image, if any */
    removeLocalImage(menuItem.image);

    await MenuItem.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Menu item deleted'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (menuItem.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.status(200).json({
      success: true,
      menuItem
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  getPublicMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  uploadMenuItemImage,
  removeMenuItemImage
};