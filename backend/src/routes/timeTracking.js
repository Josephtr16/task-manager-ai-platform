const express = require('express');
const router = express.Router({ mergeParams: true }); // Important: mergeParams to access :id from parent
const {
  startTimer,
  stopTimer,
  getTimeLogs,
  deleteTimeLog,
  getTimerStatus,
} = require('../controllers/timeTrackingController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.post('/start-timer', startTimer);
router.post('/stop-timer', stopTimer);
router.get('/timer-status', getTimerStatus);
router.get('/time-logs', getTimeLogs);
router.delete('/time-logs/:sessionId', deleteTimeLog);

module.exports = router;