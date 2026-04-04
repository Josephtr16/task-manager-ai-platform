const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyEmail, updatePreferences, updateProfile, resendVerificationEmail } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/authValidation');
const { updatePreferencesSchema, updateProfileSchema } = require('../validation/userValidation');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', protect, getMe);
router.patch('/preferences', protect, validate(updatePreferencesSchema), updatePreferences);
router.patch('/profile', protect, validate(updateProfileSchema), updateProfile);

module.exports = router;