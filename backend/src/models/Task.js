const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  estimatedDuration: {
    type: Number, // in minutes
    default: 60,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  // Dependencies for Gantt Chart
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
  // AI-related fields
  aiPriorityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
  },
  aiPredictedDuration: {
    type: Number, // in minutes
  },
  bestTime: {
    type: String, // e.g., "2:00 PM"
  },
  aiInsight: {
    type: String, // AI-generated message
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model('Task', taskSchema);