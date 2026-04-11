const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  title: {
    type: String,
    required: [true, 'Please add a task title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Work', 'Personal', 'Health', 'Shopping', 'Learning', 'Family'],
    default: 'Personal',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'done'],
    default: 'todo',
  },
  deadline: {
    type: Date,
  },
  recurrence: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    nextOccurrence: { type: Date, default: null },
    parentTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 60,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  // Task dependencies
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  // Order for Kanban/List drag & drop
  order: {
    type: Number,
    default: 0,
  },
  // Subtasks array - FYP requirement
  subtasks: [{
    title: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Collaboration
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Time tracking - FYP premium feature
  timeTracking: {
    totalTime: {
      type: Number,
      default: 0, // total minutes spent
    },
    sessions: [{
      startTime: Date,
      endTime: Date,
      duration: Number, // minutes
    }],
    isTracking: {
      type: Boolean,
      default: false,
    },
    currentSessionStart: Date,
  },
  // File attachments - FYP premium feature
  attachments: [{
    filename: String,
    filepath: String,
    filesize: Number,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  completedAt: {
    type: Date,
    default: null,
  },
  actualDuration: {
    type: Number, // in minutes
    default: null,
  },
  pomodoroCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  scheduleStartAt: {
    type: Date,
    default: null,
  },
  scheduleEndAt: {
    type: Date,
    default: null,
  },
  scheduleDurationMinutes: {
    type: Number,
    default: null,
  },
  scheduleLocked: {
    type: Boolean,
    default: false,
  },
  scheduleSource: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto',
  },
  scheduleUpdatedAt: {
    type: Date,
    default: null,
  },
  aiAccuracy: {
    predictedMinutes: {
      type: Number,
      default: null,
    },
    actualMinutes: {
      type: Number,
      default: null,
    },
    errorPercent: {
      type: Number,
      default: null,
    },
    recordedAt: {
      type: Date,
      default: null,
    },
  },
  aiPriorityScore: {
    type: Number,
    default: null,
  },
  aiInsight: {
    type: String,
    default: null,
  },
  aiPredictedDuration: {
    type: Number,
    default: null,
  },
}, { timestamps: true });

taskSchema.pre('save', function (next) {
  if (this.timeTracking && Array.isArray(this.timeTracking.sessions)) {
    this.timeTracking.totalTime = this.timeTracking.sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  }

  next();
});

// Optimizes task lookups and filtering by user, status, deadline, project, creation date, and category.
taskSchema.index({ userId: 1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, deadline: 1 });
taskSchema.index({ projectId: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Task', taskSchema);