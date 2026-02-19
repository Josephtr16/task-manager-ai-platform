const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  addSubtask,
  updateSubtask,
  toggleSubtask,
  deleteSubtask,
  getSubtasks,
} = require('../controllers/subtaskController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/').get(getSubtasks).post(addSubtask);
router.route('/:subtaskId').put(updateSubtask).delete(deleteSubtask);
router.put('/:subtaskId/toggle', toggleSubtask);

module.exports = router;