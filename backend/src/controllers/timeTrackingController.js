const Task = require('../models/Task');

// @desc    Start time tracking on a task
// @route   POST /api/tasks/:id/start-timer
// @access  Private
exports.startTimer = async (req, res) => {
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
        message: 'Timer already running for this task',
      });
    }

    // Start tracking
    task.timeTracking.isTracking = true;
    task.timeTracking.currentSessionStart = new Date();
    
    await task.save();

    res.json({
      success: true,
      message: 'Timer started',
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
// @route   POST /api/tasks/:id/stop-timer
// @access  Private
exports.stopTimer = async (req, res) => {
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
    if (!task.timeTracking.isTracking) {
      return res.status(400).json({
        success: false,
        message: 'No timer running for this task',
      });
    }

    // Calculate duration
    const endTime = new Date();
    const startTime = task.timeTracking.currentSessionStart;
    const durationMs = endTime - startTime;
    const durationMinutes = Math.round(durationMs / 60000); // Convert to minutes

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

    await task.save();

    res.json({
      success: true,
      message: `Timer stopped. Session duration: ${durationMinutes} minutes`,
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

// @desc    Get time tracking logs for a task
// @route   GET /api/tasks/:id/time-logs
// @access  Private
exports.getTimeLogs = async (req, res) => {
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
      totalTime: task.timeTracking.totalTime,
      isTracking: task.timeTracking.isTracking,
      currentSessionStart: task.timeTracking.currentSessionStart,
      sessions: task.timeTracking.sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a time log session
// @route   DELETE /api/tasks/:id/time-logs/:sessionId
// @access  Private
exports.deleteTimeLog = async (req, res) => {
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

    // Find the session
    const session = task.timeTracking.sessions.id(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Time log session not found',
      });
    }

    // Subtract from total time
    task.timeTracking.totalTime -= session.duration;

    // Remove session
    session.deleteOne();

    await task.save();

    res.json({
      success: true,
      message: 'Time log deleted',
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current timer status
// @route   GET /api/tasks/:id/timer-status
// @access  Private
exports.getTimerStatus = async (req, res) => {
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

    let currentSessionDuration = 0;
    if (task.timeTracking.isTracking && task.timeTracking.currentSessionStart) {
      const now = new Date();
      const durationMs = now - task.timeTracking.currentSessionStart;
      currentSessionDuration = Math.round(durationMs / 60000);
    }

    res.json({
      success: true,
      isTracking: task.timeTracking.isTracking,
      currentSessionStart: task.timeTracking.currentSessionStart,
      currentSessionDuration,
      totalTime: task.timeTracking.totalTime,
      sessionsCount: task.timeTracking.sessions.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};