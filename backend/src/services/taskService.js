const fs = require('fs');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const BaseService = require('./BaseService');
const projectService = require('./projectService');
const schedulerService = require('./schedulerService');

class TaskService extends BaseService {
    constructor() {
        super(Task);
        // In-memory debounce map: userId -> timeoutId
        this.scheduleDebounceMap = {};
    }

    _addRecurrenceInterval(date, frequency) {
        if (frequency === 'daily') {
            date.setDate(date.getDate() + 1);
            return;
        }

        if (frequency === 'monthly') {
            // Keep existing monthly behavior as 30-day increments.
            date.setDate(date.getDate() + 30);
            return;
        }

        // Default recurrence cadence is weekly.
        date.setDate(date.getDate() + 7);
    }

    _computeNextRecurringDeadline(task, frequency, completedAt = new Date()) {
        const completionDate = new Date(completedAt);
        const taskDeadline = task.deadline ? new Date(task.deadline) : completionDate;

        const nextDeadline = new Date(taskDeadline);
        this._addRecurrenceInterval(nextDeadline, frequency);

        while (nextDeadline <= completionDate) {
            this._addRecurrenceInterval(nextDeadline, frequency);
        }

        return nextDeadline;
    }

    /**
     * Debounced scheduler call (5 second delay per userId).
     * Rapid sequential changes only trigger one reschedule.
     */
    async _scheduleUserTasksDebounced(userId) {
        // Clear any pending timeout for this user
        if (this.scheduleDebounceMap[userId]) {
            clearTimeout(this.scheduleDebounceMap[userId]);
        }

        // Set a new timeout that will call the scheduler after 5 seconds
        return new Promise((resolve) => {
            this.scheduleDebounceMap[userId] = setTimeout(async () => {
                try {
                    delete this.scheduleDebounceMap[userId];
                    await schedulerService.scheduleUserTasks(userId);
                } catch (scheduleErr) {
                    console.warn('Scheduler failed (non-fatal):', scheduleErr.message);
                }
                resolve();
            }, 5000); // 5 second debounce delay
        });
    }

    /**
     * Check if critical scheduling fields have changed.
     * These fields affect task ordering and schedulability.
     */
    _hasSchedulingFieldsChanged(oldTask, updateData) {
        const criticalFields = ['deadline', 'estimatedDuration', 'aiPredictedDuration', 'status', 'dependencies'];
        return criticalFields.some((field) => {
            if (!(field in updateData)) return false;
            const oldValue = oldTask[field];
            const newValue = updateData[field];
            return JSON.stringify(oldValue) !== JSON.stringify(newValue);
        });
    }

    async getAcceptedSharedProjectIds(userId) {
        const projects = await Project.find({
            $or: [{ sharedWith: userId }, { 'collaborators.user': userId }],
        }).select('_id');

        return projects.map((project) => project._id);
    }

    async getTaskAccessOrConditions(userId) {
        const acceptedSharedProjectIds = await this.getAcceptedSharedProjectIds(userId);
        const conditions = [{ userId }, { sharedWith: userId }];

        if (acceptedSharedProjectIds.length > 0) {
            conditions.push({ projectId: { $in: acceptedSharedProjectIds } });
        }

        return conditions;
    }

    async getProjectPermissionForUser(projectId, userId) {
        const project = await Project.findById(projectId);
        if (!project) {
            return { hasAccess: false, permission: null, isOwner: false, project: null };
        }

        if (project.userId.toString() === userId) {
            return { hasAccess: true, permission: 'edit', isOwner: true, project };
        }

        const collaborator = (project.collaborators || []).find((entry) => entry.user.toString() === userId);
        if (collaborator) {
            return { hasAccess: true, permission: collaborator.permission || 'complete', isOwner: false, project };
        }

        const hasLegacyShare = (project.sharedWith || []).some((uid) => uid.toString() === userId);
        if (hasLegacyShare) {
            return { hasAccess: true, permission: 'complete', isOwner: false, project };
        }

        return { hasAccess: false, permission: null, isOwner: false, project };
    }

    async getTasks(userId, options = {}) {
        const {
            page = 1,
            limit = 50,
            status,
            priority,
            category,
            projectId,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            startDate,
            endDate,
        } = options;

        const safePage = Math.max(1, parseInt(page, 10) || 1);
        const safeLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

        const accessOr = await this.getTaskAccessOrConditions(userId);
        const query = { $and: [{ $or: accessOr }] };

        if (status === 'active') {
            query.$and.push({ status: { $ne: 'done' } });
        } else if (status && status !== 'all') {
            query.$and.push({ status });
        }

        if (priority) {
            query.$and.push({ priority });
        }

        if (category) {
            query.$and.push({ category });
        }

        if (projectId === 'none') {
            query.$and.push({ projectId: null });
        } else if (projectId) {
            query.$and.push({ projectId });
        }

        if (search && search.trim()) {
            const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$and.push({
                $or: [
                    { title: { $regex: escapedSearch, $options: 'i' } },
                    { description: { $regex: escapedSearch, $options: 'i' } },
                ],
            });
        }

        if (startDate || endDate) {
            const deadlineQuery = {};

            if (startDate) {
                const parsedStartDate = new Date(startDate);
                if (!Number.isNaN(parsedStartDate.getTime())) {
                    deadlineQuery.$gte = parsedStartDate;
                }
            }

            if (endDate) {
                const parsedEndDate = new Date(endDate);
                if (!Number.isNaN(parsedEndDate.getTime())) {
                    deadlineQuery.$lte = parsedEndDate;
                }
            }

            if (Object.keys(deadlineQuery).length > 0) {
                query.$and.push({ deadline: deadlineQuery });
            }
        }

        const safeSortBy = ['createdAt', 'deadline', 'priority', 'title', 'updatedAt'].includes(sortBy)
            ? sortBy
            : 'createdAt';
        const safeSortOrder = sortOrder === 'asc' ? 1 : -1;

        const [tasks, total] = await Promise.all([
            this.model.find(query)
                .populate('projectId', 'title category status')
                .sort({ [safeSortBy]: safeSortOrder })
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit),
            this.model.countDocuments(query),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / safeLimit));

        return {
            tasks,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages,
                hasMore: safePage < totalPages,
            },
        };
    }

    async getTask(id, userId) {
        const accessOr = await this.getTaskAccessOrConditions(userId);
        const task = await this.model
            .findOne({ _id: id, $or: accessOr })
            .populate('projectId', 'title category status');

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        return task;
    }

    async getTasksByProject(projectId, userId) {
        const access = await this.getProjectPermissionForUser(projectId, userId);
        if (!access.hasAccess) {
            throw new AppError('Not authorized', 401);
        }

        return this.model
            .find({ projectId })
            .populate('projectId', 'title category status')
            .sort({ order: 1, createdAt: -1 });
    }

    async createTask(taskData) {
        if (taskData.projectId) {
            const access = await this.getProjectPermissionForUser(taskData.projectId, taskData.userId.toString());
            if (!access.project) {
                throw new AppError('Project not found', 404);
            }

            // Task creation is owner/edit-permission only.
            if (!access.isOwner && access.permission !== 'edit') {
                throw new AppError('You do not have permission to create tasks in this project', 401);
            }
        }

        const task = await this.model.create(taskData);

        if (task.projectId) {
            await projectService.calculateProjectProgress(task.projectId);
        }

        // Debounce scheduler: rapid creates only trigger one reschedule after 5s
        this._scheduleUserTasksDebounced(task.userId);

        return this.model.findById(task._id).populate('projectId', 'title category status');
    }

    async updateTask(id, userId, updateData) {
        let task = await this.findById(id);
        let recurringTaskPayload = null;
        let rollbackGeneratedRecurringTasks = false;

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        // Capture old task state to check if scheduler-critical fields changed
        const oldTask = task.toObject ? task.toObject() : task;

        let permission = null;
        const isOwnerTask = task.userId.toString() === userId;

        if (isOwnerTask) {
            permission = 'edit';
        } else if (task.projectId) {
            const access = await this.getProjectPermissionForUser(task.projectId, userId);
            if (!access.hasAccess) {
                throw new AppError('Not authorized', 401);
            }
            permission = access.permission;
        } else {
            throw new AppError('Not authorized', 401);
        }

        if (permission === 'view') {
            throw new AppError('Not authorized', 401);
        }

        if (permission === 'complete' && !isOwnerTask) {
            const allowedKeys = ['status'];
            const incomingKeys = Object.keys(updateData || {});
            const hasForbiddenMutation = incomingKeys.some((key) => !allowedKeys.includes(key));

            if (hasForbiddenMutation) {
                throw new AppError('Complete-only permission can only change task status', 401);
            }
        }

        const oldProjectId = task.projectId;

        // If a completed task is reverted back to non-complete, roll back generated recurrence side effects.
        if (oldTask.status === 'done' && updateData.status && updateData.status !== 'done') {
            rollbackGeneratedRecurringTasks = true;

            // Keep recurrence enabled for recurring tasks so future completions still generate the next occurrence.
            if (task.recurrence && task.recurrence.frequency) {
                const existingRecurrence = task.recurrence.toObject ? task.recurrence.toObject() : task.recurrence;
                updateData.recurrence = {
                    ...existingRecurrence,
                    enabled: true,
                    nextOccurrence: null,
                };
            }
        }

        if (updateData.status === 'done' && task.status !== 'done') {
            if (!task.completedAt) {
                updateData.completedAt = Date.now();
            }

            const actualMinutes = task.timeTracking?.totalTime || task.estimatedDuration;
            const predictedMinutes = task.aiPredictedDuration;

            if (task.actualDuration === null) {
                updateData.actualDuration = actualMinutes || 60;
            }

            let errorPercent = null;
            if (predictedMinutes && actualMinutes) {
                errorPercent = Math.abs(actualMinutes - predictedMinutes) / predictedMinutes * 100;
            }

            updateData.aiAccuracy = {
                predictedMinutes: predictedMinutes || null,
                actualMinutes: actualMinutes || null,
                errorPercent,
                recordedAt: new Date(),
            };

            if (task.subtasks && task.subtasks.length > 0) {
                updateData.subtasks = task.subtasks.map((subtask) => ({
                    ...subtask.toObject(),
                    completed: true,
                }));
            }

            if (task.recurrence?.enabled) {
                const frequency = task.recurrence.frequency || 'weekly';
                const nextDeadline = this._computeNextRecurringDeadline(task, frequency, updateData.completedAt || new Date());

                recurringTaskPayload = {
                    userId: task.userId,
                    projectId: task.projectId || null,
                    title: task.title,
                    description: task.description,
                    category: task.category,
                    priority: task.priority,
                    status: 'todo',
                    deadline: nextDeadline,
                    estimatedDuration: task.estimatedDuration,
                    tags: Array.isArray(task.tags) ? [...task.tags] : [],
                    dependencies: Array.isArray(task.dependencies) ? [...task.dependencies] : [],
                    order: task.order || 0,
                    subtasks: Array.isArray(task.subtasks)
                        ? task.subtasks.map((subtask) => ({
                            title: subtask.title,
                            completed: false,
                        }))
                        : [],
                    recurrence: {
                        enabled: true,
                        frequency,
                        nextOccurrence: nextDeadline,
                        parentTaskId: task._id,
                    },
                    completedAt: null,
                };
            }
        }

        task = await this.model.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate('projectId', 'title category status');

        if (oldProjectId) {
            await projectService.calculateProjectProgress(oldProjectId);
        }

        if (task.projectId && String(task.projectId._id || task.projectId) !== String(oldProjectId || '')) {
            await projectService.calculateProjectProgress(task.projectId._id || task.projectId);
        }

        if (recurringTaskPayload) {
            await this.model.create(recurringTaskPayload);
        }

        if (rollbackGeneratedRecurringTasks) {
            await this.model.deleteMany({
                userId: task.userId,
                title: task.title,
                status: 'todo',
                completedAt: null,
                'recurrence.parentTaskId': task._id,
            });
        }

        // Only reschedule if critical fields changed (deadline, estimatedDuration, aiPredictedDuration, status, dependencies)
        // This prevents expensive rescheduling on minor updates (e.g., title, description)
        if (this._hasSchedulingFieldsChanged(oldTask, updateData)) {
            this._scheduleUserTasksDebounced(task.userId);
        }

        return task;
    }

    async deleteTask(id, userId) {
        const task = await this.findById(id);

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        const isOwnerTask = task.userId.toString() === userId;
        if (!isOwnerTask) {
            if (!task.projectId) {
                throw new AppError('Not authorized', 401);
            }

            const access = await this.getProjectPermissionForUser(task.projectId, userId);
            if (!access.hasAccess || access.permission !== 'edit') {
                throw new AppError('Not authorized', 401);
            }
        }

        const projectId = task.projectId;

        await task.deleteOne();

        if (projectId) {
            await projectService.calculateProjectProgress(projectId);
        }

        // Debounce scheduler: rapid deletes only trigger one reschedule after 5s
        this._scheduleUserTasksDebounced(task.userId);

        return true;
    }

    async addAttachment(id, userId, file) {
        const task = await this.findById(id);

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        const isOwnerTask = task.userId.toString() === userId;
        if (!isOwnerTask) {
            if (!task.projectId) {
                throw new AppError('Not authorized', 401);
            }

            const access = await this.getProjectPermissionForUser(task.projectId, userId);
            if (!access.hasAccess || access.permission !== 'edit') {
                throw new AppError('Not authorized', 401);
            }
        }

        const attachment = {
            filename: file.originalname,
            filepath: file.path,
            filesize: file.size,
            mimetype: file.mimetype,
        };

        task.attachments.push(attachment);
        await task.save();

        return attachment;
    }

    async removeAttachment(id, userId, attachmentId) {
        const task = await this.findById(id);

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        const isOwnerTask = task.userId.toString() === userId;
        if (!isOwnerTask) {
            if (!task.projectId) {
                throw new AppError('Not authorized', 401);
            }

            const access = await this.getProjectPermissionForUser(task.projectId, userId);
            if (!access.hasAccess || access.permission !== 'edit') {
                throw new AppError('Not authorized', 401);
            }
        }

        const attachment = task.attachments.id(attachmentId);
        if (!attachment) {
            throw new AppError('Attachment not found', 404);
        }

        const filepath = attachment.filepath;
        attachment.deleteOne();
        await task.save();

        if (filepath && fs.existsSync(filepath)) {
            fs.unlink(filepath, (err) => {
                if (err) {
                    console.error('Failed to remove attachment file:', err.message);
                }
            });
        }

        return task;
    }

    async addComment(id, userId, text) {
        const task = await this.findById(id);

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        let canComment = task.userId.toString() === userId;
        if (!canComment && task.projectId) {
            const access = await this.getProjectPermissionForUser(task.projectId, userId);
            canComment = access.hasAccess && access.permission !== 'view';
        }

        if (!canComment) {
            // Backward compatibility for task-level sharing.
            canComment = (task.sharedWith || []).some((uid) => uid.toString() === userId);
        }

        if (!canComment) {
            throw new AppError('Task not found or unauthorized', 404);
        }

        const comment = {
            user: userId,
            text,
        };

        task.comments.push(comment);
        await task.save();

        return task.comments[task.comments.length - 1];
    }

    async shareTask(id, userId, email) {
        const task = await this.findById(id);

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        if (task.userId.toString() !== userId) {
            throw new AppError('Not authorized', 401);
        }

        const targetUser = await User.findOne({ email });

        if (!targetUser) {
            throw new AppError('User not found', 404);
        }

        if (targetUser._id.toString() === userId) {
            throw new AppError('Cannot share with yourself', 400);
        }

        if (task.sharedWith.includes(targetUser._id)) {
            throw new AppError('Task already shared with this user', 400);
        }

        task.sharedWith.push(targetUser._id);
        await task.save();

        return {
            id: targetUser._id,
            name: targetUser.name,
            email: targetUser.email,
        };
    }

    async getUpcoming(userId) {
        const accessOr = await this.getTaskAccessOrConditions(userId);
        const now = new Date();

        return this.model.find({
            $or: accessOr,
            status: { $ne: 'done' },
            deadline: { $gte: now },
        })
            .populate('projectId', 'title category')
            .sort({ deadline: 1 })
            .limit(5);
    }

    async getStatistics(userId) {
        const accessOr = await this.getTaskAccessOrConditions(userId);
        const tasks = await this.model.find({ $or: accessOr });

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const stats = {
            total: tasks.length,
            completed: tasks.filter((t) => t.status === 'done').length,
            inProgress: tasks.filter((t) => t.status === 'in-progress').length,
            todo: tasks.filter((t) => t.status === 'todo').length,
            dueToday: tasks.filter((t) =>
                t.deadline &&
                new Date(t.deadline) >= today &&
                new Date(t.deadline) < tomorrow &&
                t.status !== 'done'
            ).length,
            dueTomorrow: tasks.filter((t) => {
                if (!t.deadline || t.status === 'done') return false;
                const taskDate = new Date(t.deadline);
                return taskDate >= tomorrow && taskDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
            }).length,
            overdue: tasks.filter((t) =>
                t.deadline &&
                new Date(t.deadline) < now &&
                t.status !== 'done'
            ).length,
            urgent: tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length,
            highPriority: tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length,
        };

        const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        const onTimeRate = stats.overdue === 0 ? 100 : Math.max(0, 100 - (stats.overdue / stats.total) * 100);
        const productivityScore = Math.round((completionRate * 0.6) + (onTimeRate * 0.4));

        const focusTime = tasks.reduce((total, task) => total + (task.timeTracking?.totalTime || 0), 0);

        const calculateStreak = (allTasks) => {
            const completedTasks = allTasks
                .filter((t) => t.status === 'done' && t.completedAt)
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

            if (completedTasks.length === 0) return 0;

            let streak = 0;
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            for (let i = 0; i < completedTasks.length; i += 1) {
                const taskDate = new Date(completedTasks[i].completedAt);
                taskDate.setHours(0, 0, 0, 0);

                const daysDiff = Math.floor((currentDate - taskDate) / (1000 * 60 * 60 * 24));

                if (daysDiff === streak) {
                    streak += 1;
                } else if (daysDiff > streak) {
                    break;
                }
            }

            return streak;
        };

        const streak = calculateStreak(tasks);

        return {
            ...stats,
            productivityScore,
            focusTime,
            streak,
        };
    }
}

module.exports = new TaskService();
