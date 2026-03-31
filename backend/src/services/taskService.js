const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const BaseService = require('./BaseService');
const projectService = require('./projectService');
const fs = require('fs');

class TaskService extends BaseService {
    constructor() {
        super(Task);
    }

    async getTasks(userId) {
        return await this.model.find({ userId })
            .populate('projectId', 'title category status')
            .sort({ createdAt: -1 });
    }

    async getTask(id, userId) {
        const task = await this.findById(id);

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        if (task.userId.toString() !== userId) {
            throw new AppError('Not authorized', 401);
        }

        return task;
    }

    async getTasksByProject(projectId, userId) {
        return await this.model.find({ projectId, userId })
            .populate('projectId', 'title category status')
            .sort({ order: 1, createdAt: -1 });
    }

    async createTask(taskData) {
        const task = await this.model.create(taskData);
        if (task.projectId) {
            await projectService.calculateProjectProgress(task.projectId);
        }
        return task;
    }

    async updateTask(id, userId, updateData) {
        let task = await this.findById(id);

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        if (task.userId.toString() !== userId) {
            throw new AppError('Not authorized', 401);
        }

        const oldProjectId = task.projectId;

        // specific logic for status change
        if (updateData.status === 'done' && task.status !== 'done') {
            if (!task.completedAt) {
                updateData.completedAt = Date.now();
            }

            if (task.actualDuration === null) {
                updateData.actualDuration = task.estimatedDuration || 60; // Assuming default 60 or fallback
            }

            // Mark all subtasks as completed when task is marked done
            if (task.subtasks && task.subtasks.length > 0) {
                updateData.subtasks = task.subtasks.map(subtask => ({
                    ...subtask.toObject ? subtask.toObject() : subtask,
                    completed: true
                }));
            }

            // Send feedback to AI if we have simple duration tracking or estimate
            // Use totalTime from timeTracking if available, otherwise just skip or use a simple heuristic?

        }

        task = await this.model.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (task.projectId) {
            await projectService.calculateProjectProgress(task.projectId);
        }
        if (oldProjectId && oldProjectId.toString() !== (task.projectId ? task.projectId.toString() : '')) {
            await projectService.calculateProjectProgress(oldProjectId);
        }

        return task;
    }

    async deleteTask(id, userId) {
        const task = await this.findById(id);

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        if (task.userId.toString() !== userId) {
            throw new AppError('Not authorized', 401);
        }

        const projectId = task.projectId;

        await task.deleteOne();

        if (projectId) {
            await projectService.calculateProjectProgress(projectId);
        }

        return true;
    }

    async addAttachment(id, userId, file) {
        const task = await this.getTask(id, userId);

        const attachment = {
            filename: file.originalname,
            filepath: file.path,
            filesize: file.size,
            mimetype: file.mimetype
        };

        task.attachments.push(attachment);
        await task.save();

        return attachment;
    }

    async removeAttachment(id, userId, attachmentId) {
        const task = await this.getTask(id, userId);

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
        // Find task (allow shared users to comment too? For now only owner)
        // If we want shared users, we need to adjust getTask or check sharedWith
        const task = await this.model.findOne({
            $or: [{ userId: userId }, { sharedWith: userId }],
            _id: id
        });

        if (!task) {
            throw new AppError('Task not found or unauthorized', 404);
        }

        const comment = {
            user: userId,
            text
        };

        task.comments.push(comment);
        await task.save();

        return task.comments[task.comments.length - 1];
    }

    async shareTask(id, userId, email) {
        const task = await this.getTask(id, userId);

        // Find target user
        const targetUser = await User.findOne({ email });

        if (!targetUser) {
            throw new AppError('User not found', 404);
        }

        if (targetUser._id.toString() === userId) {
            throw new AppError('Cannot share with yourself', 400);
        }

        // Check if already shared
        if (task.sharedWith.includes(targetUser._id)) {
            throw new AppError('Task already shared with this user', 400);
        }

        task.sharedWith.push(targetUser._id);
        await task.save();

        return {
            id: targetUser._id,
            name: targetUser.name,
            email: targetUser.email
        };
    }

    async getUpcoming(userId) {
        const now = new Date();
        return await this.model.find({
            userId: userId,
            status: { $ne: 'done' },
            deadline: { $gte: now },
        })
            .populate('projectId', 'title category')
            .sort({ deadline: 1 })
            .limit(5);
    }

    async getStatistics(userId) {
        const tasks = await this.model.find({ userId: userId });

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const stats = {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'done').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            todo: tasks.filter(t => t.status === 'todo').length,
            dueToday: tasks.filter(t =>
                t.deadline &&
                new Date(t.deadline) >= today &&
                new Date(t.deadline) < tomorrow &&
                t.status !== 'done'
            ).length,
            dueTomorrow: tasks.filter(t => {
                if (!t.deadline || t.status === 'done') return false;
                const taskDate = new Date(t.deadline);
                return taskDate >= tomorrow && taskDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
            }).length,
            overdue: tasks.filter(t =>
                t.deadline &&
                new Date(t.deadline) < now &&
                t.status !== 'done'
            ).length,
            urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
            highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'done').length,
        };

        // Calculate productivity score (0-100)
        const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        const onTimeRate = stats.overdue === 0 ? 100 : Math.max(0, 100 - (stats.overdue / stats.total) * 100);
        const productivityScore = Math.round((completionRate * 0.6) + (onTimeRate * 0.4));

        // Calculate focus time (sum of time tracking)
        const focusTime = tasks.reduce((total, task) => {
            return total + (task.timeTracking?.totalTime || 0);
        }, 0);

        // Streak logic
        const calculateStreak = (tasks) => {
            const completedTasks = tasks
                .filter(t => t.status === 'done' && t.completedAt)
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

            if (completedTasks.length === 0) return 0;

            let streak = 0;
            let currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            for (let i = 0; i < completedTasks.length; i++) {
                const taskDate = new Date(completedTasks[i].completedAt);
                taskDate.setHours(0, 0, 0, 0);

                const daysDiff = Math.floor((currentDate - taskDate) / (1000 * 60 * 60 * 24));

                if (daysDiff === streak) {
                    streak++;
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
