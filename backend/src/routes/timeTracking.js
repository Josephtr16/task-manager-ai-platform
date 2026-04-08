const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  startTimer,
  stopTimer,
  getTimerStatus,
} = require('../controllers/timeTrackingController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.post('/:taskId/time/start', startTimer);
router.post('/:taskId/time/stop', stopTimer);
router.get('/:taskId/time', getTimerStatus);

module.exports = router;