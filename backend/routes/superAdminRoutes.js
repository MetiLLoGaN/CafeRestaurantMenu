const express = require('express');
const router = express.Router();
const {
  getStats,
  listUsers,
  createUser,
  updateUser,
  resetPassword
} = require('../controllers/superAdminController');
const auth = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/authMiddleware');

/* Every route below requires a valid JWT (auth) AND the persisted
   super_admin role (requireSuperAdmin). Restaurant admins and
   anonymous callers receive 401/403 — frontend route guards are
   convenience only; the backend is the enforcement point. */
router.use(auth, requireSuperAdmin);

router.get('/stats', getStats);
router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/password', resetPassword);

module.exports = router;
