const taskService = require('../services/taskService');
const asyncHandler = require('../middleware/asyncHandler');
const sendResponse = require('../utils/ApiResponse');

// @desc    Get all tasks for user
// @route   GET /api/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasks(req.user.id);

  sendResponse(res, 200, true, {
    count: tasks.length,
    tasks,
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.params.id, req.user.id);

  sendResponse(res, 200, true, { task });
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({
    ...req.body,
    userId: req.user.id,
  });

  sendResponse(res, 201, true, { task });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.user.id, req.body);

  sendResponse(res, 200, true, { task });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user.id);

  sendResponse(res, 200, true, null, 'Task deleted');
});

// @desc    Get task statistics for dashboard
// @route   GET /api/tasks/statistics
// @access  Private
exports.getStatistics = asyncHandler(async (req, res) => {
  const stats = await taskService.getStatistics(req.user.id);

  sendResponse(res, 200, true, { stats });
});

// @desc    Get upcoming tasks
// @route   GET /api/tasks/upcoming
// @access  Private
exports.getUpcoming = asyncHandler(async (req, res) => {
  const tasks = await taskService.getUpcoming(req.user.id);

  sendResponse(res, 200, true, { tasks });
});

// @desc    Upload attachment
// @route   POST /api/tasks/:id/attachments
// @access  Private
exports.addAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendResponse(res, 400, false, null, 'No file uploaded');
  }

  const attachment = await taskService.addAttachment(req.params.id, req.user.id, req.file);

  sendResponse(res, 201, true, { attachment });
});

// @desc    Add comment
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res) => {
  const comment = await taskService.addComment(req.params.id, req.user.id, req.body.text);

  sendResponse(res, 201, true, { comment });
});

// @desc    Share task
// @route   POST /api/tasks/:id/share
// @access  Private
exports.shareTask = asyncHandler(async (req, res) => {
  const user = await taskService.shareTask(req.params.id, req.user.id, req.body.email);

  sendResponse(res, 200, true, { user }, 'Task shared successfully');
});