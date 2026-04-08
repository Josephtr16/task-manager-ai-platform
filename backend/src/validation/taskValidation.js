const Joi = require('joi');

const recurrenceSchema = Joi.object({
    enabled: Joi.boolean().default(false),
    frequency: Joi.string().valid('daily', 'weekly', 'monthly').default('weekly'),
    nextOccurrence: Joi.date().allow(null),
    parentTaskId: Joi.string().allow(null, ''),
});

const createTaskSchema = Joi.object({
    title: Joi.string().required().trim().messages({
        'any.required': 'Please add a task title'
    }),
    description: Joi.string().allow('').trim(),
    category: Joi.string().valid('Work', 'Personal', 'Health', 'Shopping', 'Learning', 'Family').default('Personal'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    status: Joi.string().valid('todo', 'in-progress', 'review', 'done').default('todo'),
    deadline: Joi.date().allow(null),
    projectId: Joi.string().allow(null, '').optional(),
    estimatedDuration: Joi.number().min(0).default(60),
    tags: Joi.array().items(Joi.string().trim()),
    dependencies: Joi.array().items(Joi.string()),
    order: Joi.number(),
    recurrence: recurrenceSchema,
    subtasks: Joi.array().items(
        Joi.object({
            title: Joi.string().required(),
            completed: Joi.boolean().default(false)
        })
    )
});

const updateTaskSchema = Joi.object({
    title: Joi.string().trim(),
    description: Joi.string().allow('').trim(),
    category: Joi.string().valid('Work', 'Personal', 'Health', 'Shopping', 'Learning', 'Family'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    status: Joi.string().valid('todo', 'in-progress', 'review', 'done'),
    projectId: Joi.string().allow(null, '').optional(),
    deadline: Joi.date().allow(null),
    estimatedDuration: Joi.number().min(0),
    tags: Joi.array().items(Joi.string().trim()),
    dependencies: Joi.array().items(Joi.string()),
    order: Joi.number(),
    recurrence: recurrenceSchema,
    subtasks: Joi.array().items(
        Joi.object({
            title: Joi.string().required(),
            completed: Joi.boolean()
        })
    ),
    aiPriorityScore: Joi.number().min(0).max(100),
    aiPredictedDuration: Joi.number(),
    bestTime: Joi.string(),
    aiInsight: Joi.string(),
    completedAt: Joi.date()
});

module.exports = {
    createTaskSchema,
    updateTaskSchema
};
