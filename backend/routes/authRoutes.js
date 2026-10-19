const express = require('express');
const router = express.Router();
const { registrationDisabled, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

/* Public self-registration is disabled — see authController. */
router.post('/register', registrationDisabled);
router.post('/login', login);
router.get('/me', auth, getMe);

module.exports = router;
