const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationTokenHash: String,
  verificationTokenExpires: Date,
  resetPasswordTokenHash: String,
  resetPasswordExpires: Date,
  passwordChangedAt: {
    type: Date,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
    },
    notifications: {
      taskReminders: { type: Boolean, default: true },
      aiSuggestions: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: true },
    },
    kanbanColumns: [{
      id: { type: String, default: 'todo' },
      title: { type: String, default: 'To Do' },
      order: { type: Number, default: 0 },
    }, {
      id: { type: String, default: 'in-progress' },
      title: { type: String, default: 'In Progress' },
      order: { type: Number, default: 1 },
    }, {
      id: { type: String, default: 'review' },
      title: { type: String, default: 'Review' },
      order: { type: Number, default: 2 },
    }, {
      id: { type: String, default: 'done' },
      title: { type: String, default: 'Done' },
      order: { type: Number, default: 3 },
    }],
  },
});

// Optimizes user lookup by email and verification token checks.
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ verificationTokenHash: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);