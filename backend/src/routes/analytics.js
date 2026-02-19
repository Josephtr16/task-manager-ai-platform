const express = require('express');
const router = express.Router();
const {
  getProductivityTrend,
  getCategoryDistribution,
  getTimeOfDayAnalysis,
  getPerformanceMetrics,
  getBestDays,
  getAIInsights,
  getCompletionRate,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/productivity-trend', getProductivityTrend);
router.get('/category-distribution', getCategoryDistribution);
router.get('/time-of-day', getTimeOfDayAnalysis);
router.get('/performance-metrics', getPerformanceMetrics);
router.get('/best-days', getBestDays);
router.get('/ai-insights', getAIInsights);
router.get('/completion-rate', getCompletionRate);

module.exports = router;