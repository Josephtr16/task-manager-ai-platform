const authService = require('../services/authService');
const asyncHandler = require('../middleware/asyncHandler');
const sendResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  sendResponse(res, 201, true, result, result.message || 'Registration successful');
});

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { email, token } = req.body;
  const result = await authService.verifyEmail(email, token);

  sendResponse(res, 200, true, result, result.message);
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const result = await authService.resendVerificationEmail(email);

  sendResponse(res, 200, true, result, 'Verification email sent successfully');
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const result = await authService.forgotPassword(email);
  sendResponse(res, 200, true, result, result.message);
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    throw new AppError('Email, token and newPassword are required', 400);
  }

  const result = await authService.resetPassword(email, token, newPassword);
  sendResponse(res, 200, true, result, result.message);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  sendResponse(res, 200, true, result, 'User logged in successfully');
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);

  sendResponse(res, 200, true, { user });
});

// @desc    Update user preferences
// @route   PATCH /api/auth/preferences
// @access  Private
exports.updatePreferences = asyncHandler(async (req, res) => {
  if (!req.body?.preferences) {
    throw new AppError('Preferences payload is required', 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { preferences: req.body.preferences },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new AppError('User not found', 404);
  }

  sendResponse(res, 200, true, { user: updatedUser }, 'Preferences updated successfully');
});

// @desc    Update user profile
// @route   PATCH /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, currentPassword, newPassword } = req.body || {};

  if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
    throw new AppError('Current password and new password are required to change password', 400);
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (name) {
    user.name = name;
  }

  if (currentPassword && newPassword) {
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now() - 1000; // 1s buffer for token timing
  }

  await user.save();

  const updatedUser = user.toObject();
  delete updatedUser.password;

  sendResponse(res, 200, true, { user: updatedUser }, 'Profile updated successfully');
});