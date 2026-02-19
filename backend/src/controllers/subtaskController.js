const Task = require('../models/Task');

// @desc    Add a subtask to a task
// @route   POST /api/tasks/:id/subtasks
// @access  Private
exports.addSubtask = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a subtask title',
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Make sure user owns task
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Add subtask
    task.subtasks.push({
      title,
      completed: false,
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Subtask added',
      subtask: task.subtasks[task.subtasks.length - 1],
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update a subtask
// @route   PUT /api/tasks/:id/subtasks/:subtaskId
// @access  Private
exports.updateSubtask = async (req, res) => {
  try {
    const { title, completed } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Make sure user owns task
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Find subtask
    const subtask = task.subtasks.id(req.params.subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found',
      });
    }

    // Update fields
    if (title !== undefined) subtask.title = title;
    if (completed !== undefined) subtask.completed = completed;

    await task.save();

    res.json({
      success: true,
      message: 'Subtask updated',
      subtask,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Toggle subtask completion
// @route   PUT /api/tasks/:id/subtasks/:subtaskId/toggle
// @access  Private
exports.toggleSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Make sure user owns task
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Find subtask
    const subtask = task.subtasks.id(req.params.subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found',
      });
    }

    // Toggle completed
    subtask.completed = !subtask.completed;

    await task.save();

    res.json({
      success: true,
      message: subtask.completed ? 'Subtask marked as completed' : 'Subtask marked as incomplete',
      subtask,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a subtask
// @route   DELETE /api/tasks/:id/subtasks/:subtaskId
// @access  Private
exports.deleteSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Make sure user owns task
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Find and remove subtask
    const subtask = task.subtasks.id(req.params.subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found',
      });
    }

    // Remove subtask
    subtask.deleteOne();

    await task.save();

    res.json({
      success: true,
      message: 'Subtask deleted',
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all subtasks for a task
// @route   GET /api/tasks/:id/subtasks
// @access  Private
exports.getSubtasks = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Make sure user owns task
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const completedCount = task.subtasks.filter(s => s.completed).length;
    const totalCount = task.subtasks.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    res.json({
      success: true,
      subtasks: task.subtasks,
      stats: {
        total: totalCount,
        completed: completedCount,
        incomplete: totalCount - completedCount,
        completionPercentage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};