const Joi = require('joi');

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const updatePreferencesSchema = Joi.object({
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'auto').optional(),
    workingHours: Joi.object({
      start: Joi.string().pattern(timePattern).optional(),
      end: Joi.string().pattern(timePattern).optional(),
    }).optional(),
    notifications: Joi.object({
      taskReminders: Joi.boolean().optional(),
      aiSuggestions: Joi.boolean().optional(),
      dailySummary: Joi.boolean().optional(),
    }).optional(),
  }).required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().optional(),
  currentPassword: Joi.string().optional(),
  newPassword: Joi.string().min(6).optional().messages({
    'string.min': 'New password must be at least 6 characters',
  }),
});

module.exports = {
  updatePreferencesSchema,
  updateProfileSchema,
};