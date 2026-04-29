const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Get the current user's saved daily plan
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('dailyPlan');
    return res.status(200).json({ success: true, data: user?.dailyPlan || null });
  } catch (error) {
    console.error('Failed to load daily plan for user', req.user?.id, error?.message || error);
    return res.status(500).json({ success: false, message: 'Failed to load daily plan.' });
  }
});

// Save or update the current user's daily plan
router.post('/', protect, async (req, res) => {
  try {
    const plan = req.body || null;
    const updated = await User.findByIdAndUpdate(req.user.id, { dailyPlan: plan }, { new: true }).select('dailyPlan');
    return res.status(200).json({ success: true, data: updated.dailyPlan });
  } catch (error) {
    console.error('Failed to save daily plan for user', req.user?.id, error?.message || error);
    return res.status(500).json({ success: false, message: 'Failed to save daily plan.' });
  }
});

// Delete the current user's saved daily plan
router.delete('/', protect, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.user.id, { $unset: { dailyPlan: 1 } }, { new: true }).select('dailyPlan');
    return res.status(200).json({ success: true, data: null });
  } catch (error) {
    console.error('Failed to delete daily plan for user', req.user?.id, error?.message || error);
    return res.status(500).json({ success: false, message: 'Failed to delete daily plan.' });
  }
});

module.exports = router;
