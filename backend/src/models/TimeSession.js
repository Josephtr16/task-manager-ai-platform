const mongoose = require('mongoose');

const timeSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null,
    },
    startAt: {
        type: Date,
        required: true,
    },
    endAt: {
        type: Date,
        required: true,
    },
    durationMinutes: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Optimizes time session lookups by task and recent sessions per user.
timeSessionSchema.index({ taskId: 1 });
timeSessionSchema.index({ userId: 1, startAt: -1 });

module.exports = mongoose.model('TimeSession', timeSessionSchema);
