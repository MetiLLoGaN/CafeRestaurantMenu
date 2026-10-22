const express = require('express');
const router = express.Router();
const {
  listAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute
} = require('../controllers/attributeController');
const auth = require('../middleware/authMiddleware');

/* Admins manage only their own attributes — every handler is scoped to
   req.user.id (tenant isolation), like /api/branding and /api/menu-content. */
router
  .route('/')
  .get(auth, listAttributes)
  .post(auth, createAttribute);

router
  .route('/:id')
  .put(auth, updateAttribute)
  .delete(auth, deleteAttribute);

module.exports = router;
