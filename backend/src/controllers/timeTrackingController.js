const Task = require('../models/Task');

// @desc    Start time tracking on a task
// @route   POST /api/tasks/:id/time/start
// @access  Private
const startTracking = async (req, res) => {
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

    // Check if already tracking
    if (task.timeTracking.isTracking) {
      return res.status(400).json({
        success: false,
        message: 'Time tracking is already running for this task',
      });
    }

    // Start embedded task tracking session
    task.timeTracking.isTracking = true;
    task.timeTracking.currentSessionStart = new Date();

    await task.save();

    res.json({
      success: true,
      message: 'Time tracking started',
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Stop time tracking on a task
// @route   POST /api/tasks/:id/time/stop
// @access  Private
const stopTracking = async (req, res) => {
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

    // Check if actually tracking
    if (!task.timeTracking.isTracking || !task.timeTracking.currentSessionStart) {
      return res.status(400).json({
        success: false,
        message: 'No active tracking session for this task',
      });
    }

    // Calculate duration (minutes)
    const now = Date.now();
    const endTime = new Date();
    const startTime = task.timeTracking.currentSessionStart;
    const durationMs = now - new Date(startTime).getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    // Add session to history
    task.timeTracking.sessions.push({
      startTime,
      endTime,
      duration: durationMinutes,
    });

    // Update total time
    task.timeTracking.totalTime += durationMinutes;

    // Stop tracking
    task.timeTracking.isTracking = false;
    task.timeTracking.currentSessionStart = null;
    task.actualDuration = task.timeTracking.totalTime;

    await task.save();

    res.json({
      success: true,
      message: `Time tracking stopped. Session duration: ${durationMinutes} minutes`,
      sessionDuration: durationMinutes,
      totalTime: task.timeTracking.totalTime,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get time tracking stats for a task
// @route   GET /api/tasks/:id/time
// @access  Private
const getTimeStats = async (req, res) => {
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

    res.json({
      success: true,
      totalTime: task.timeTracking.totalTime || 0,
      sessions: task.timeTracking.sessions || [],
      isTracking: task.timeTracking.isTracking || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.startTracking = startTracking;
exports.stopTracking = stopTracking;
exports.getTimeStats = getTimeStats;

// Backward-compatible aliases
exports.startTimer = startTracking;
exports.stopTimer = stopTracking;
exports.getTimeLogs = getTimeStats;
exports.getTimerStatus = getTimeStats;