const express = require('express');
const router = express.Router();
const {
  getMenuContent,
  updateMenuContent
} = require('../controllers/menuContentController');
const auth = require('../middleware/authMiddleware');

/* Restaurant admins edit only their own content — every handler is
   scoped to req.user.id (tenant isolation), like /api/branding. */
router
  .route('/')
  .get(auth, getMenuContent)
  .put(auth, updateMenuContent);

module.exports = router;
