const express = require('express');
const { startSession, stopSession, getUserSummary } = require('../controllers/timeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/start', startSession);
router.post('/stop', stopSession);
router.get('/user-summary', getUserSummary);

module.exports = router;
