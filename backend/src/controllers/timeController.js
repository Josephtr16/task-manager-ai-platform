const Task = require('../models/Task');
const TimeSession = require('../models/TimeSession');
const asyncHandler = require('../middleware/asyncHandler');
const sendResponse = require('../utils/ApiResponse');

// @desc    Start tracking time for a task (or globally if no task)
// @route   POST /api/time/start
// @access  Private
exports.startSession = asyncHandler(async (req, res) => {
    const { taskId } = req.body;

    // We could check if there's already an active session, but the prompt just says:
    // POST /api/time/start
    const newSession = await TimeSession.create({
        userId: req.user.id,
        taskId: taskId || null,
        startAt: new Date(),
        endAt: new Date(), // temporary
        durationMinutes: 0
    });

    sendResponse(res, 201, true, { session: newSession }, 'Time tracking started');
});

// @desc    Stop tracking time
// @route   POST /api/time/stop
// @access  Private
exports.stopSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;

    const session = await TimeSession.findOne({ _id: sessionId, userId: req.user.id });

    if (!session) {
        return sendResponse(res, 404, false, null, 'Session not found');
    }

    const endAt = new Date();
    const durationMs = endAt - session.startAt;
    const durationMinutes = Math.round(durationMs / 60000);

    session.endAt = endAt;
    session.durationMinutes = durationMinutes;
    await session.save();

    if (session.taskId) {
        const task = await Task.findById(session.taskId);
        if (task) {
            if (task.actualDuration === null) {
                task.actualDuration = 0;
            }
            task.actualDuration += durationMinutes;

            if (task.status === 'done' && !task.completedAt) {
                task.completedAt = new Date();
            }

            await task.save();
        }
    }

    sendResponse(res, 200, true, { session }, 'Time tracking stopped');
});

// @desc    Get user time summary
// @route   GET /api/time/user-summary
// @access  Private
exports.getUserSummary = asyncHandler(async (req, res) => {
    const sessions = await TimeSession.find({ userId: req.user.id });

    const totalDuration = sessions.reduce((acc, sess) => acc + sess.durationMinutes, 0);

    sendResponse(res, 200, true, { totalSessions: sessions.length, totalDurationMinutes: totalDuration, sessions });
});
