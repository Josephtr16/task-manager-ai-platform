const authService = require('../services/authService');
const asyncHandler = require('../middleware/asyncHandler');
const sendResponse = require('../utils/ApiResponse');

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