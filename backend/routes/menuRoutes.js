const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/menuController');
const auth = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/imageUpload');

router.get('/public', getPublicMenu);

router.route('/categories')
  .get(auth, getCategories)
  .post(auth, createCategory);

router.route('/categories/:id')
  .put(auth, updateCategory)
  .delete(auth, deleteCategory);

router.route('/items')
  .get(auth, getMenuItems)
  .post(auth, createMenuItem);

router.route('/items/:id')
  .put(auth, updateMenuItem)
  .delete(auth, deleteMenuItem);

router.post('/items/:id/image', auth, upload.single('image'), handleUploadError, uploadMenuItemImage);
router.delete('/items/:id/image', auth, removeMenuItemImage);

router.patch('/items/:id/toggle', auth, toggleAvailability);

module.exports = router;