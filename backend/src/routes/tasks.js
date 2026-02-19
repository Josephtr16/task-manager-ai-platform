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
  addComment,
  shareTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { createTaskSchema, updateTaskSchema } = require('../validation/taskValidation');

router.use(protect);

router.get('/statistics', getStatistics);
router.get('/upcoming', getUpcoming);

router.post('/:id/attachments', upload.single('file'), addAttachment);
router.post('/:id/comments', addComment);
router.post('/:id/share', shareTask);

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