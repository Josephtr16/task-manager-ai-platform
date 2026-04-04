const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getStatistics,
  getUpcoming,
  addAttachment,
  removeAttachment,
  addComment,
  shareTask,
  getProjectTasks
} = require('../controllers/taskController');
const timeTrackingController = require('../controllers/timeTrackingController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { createTaskSchema, updateTaskSchema } = require('../validation/taskValidation');

router.use(protect);

router.get('/statistics', getStatistics);
router.get('/upcoming', getUpcoming);
router.get('/project/:projectId', getProjectTasks);

router.post('/:id/attachments', upload.single('file'), addAttachment);
router.delete('/:id/attachments/:attachmentId', removeAttachment);
router.post('/:id/comments', addComment);
router.post('/:id/share', shareTask);
router.post('/:id/time/start', protect, timeTrackingController.startTracking);
router.post('/:id/time/stop', protect, timeTrackingController.stopTracking);
router.get('/:id/time', protect, timeTrackingController.getTimeStats);

router
  .route('/')
  .get(getTasks)
  .post(validate(createTaskSchema), createTask);

router
  .route('/:id')
  .get(getTask)
  .put(validate(updateTaskSchema), updateTask)
  .delete(deleteTask);

module.exports = router;