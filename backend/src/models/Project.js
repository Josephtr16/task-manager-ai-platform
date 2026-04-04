const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a project title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Work', 'Personal', 'Health', 'Shopping', 'Learning', 'Family'],
    default: 'Work',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started',
  },
  estimatedTotalHours: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  completedTasks: {
    type: Number,
    default: 0,
  },
  totalTasks: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
  completedDate: {
    type: Date,
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Collaboration - accepted collaborators
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Collaboration with permission levels managed by owner
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permission: {
      type: String,
      enum: ['view', 'complete', 'edit'],
      default: 'complete',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Collaboration invites that require explicit recipient acceptance
  shareInvites: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'declined'],
      default: 'pending',
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  }],
}, {
  timestamps: true
});

// Optimizes project lists and status filters scoped to a user.
projectSchema.index({ userId: 1 });
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ 'shareInvites.user': 1, 'shareInvites.status': 1 });
projectSchema.index({ 'collaborators.user': 1 });

module.exports = mongoose.model('Project', projectSchema);
