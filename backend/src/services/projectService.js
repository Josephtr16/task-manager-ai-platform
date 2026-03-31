const Project = require('../models/Project');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const BaseService = require('./BaseService');

class ProjectService extends BaseService {
    constructor() {
        super(Project);
    }

    async getProjects(userId) {
        return await this.model.find({ userId }).sort({ createdAt: -1 });
    }

    async getProject(id, userId) {
        const project = await this.findById(id);

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        if (project.userId.toString() !== userId) {
            throw new AppError('Not authorized', 401);
        }

        // Fetch associated tasks
        const tasks = await Task.find({ projectId: id }).sort({ order: 1, createdAt: -1 });

        return { project, tasks };
    }

    async createProject(projectData) {
        const { tasks, ...projectFields } = projectData;
        const project = await this.model.create(projectFields);

        // If tasks are provided, create them and associate with project
        if (tasks && Array.isArray(tasks) && tasks.length > 0) {
            const tasksToCreate = tasks.map(task => ({
                ...task,
                projectId: project._id,
                userId: project.userId,
                status: task.status || 'todo'
            }));
            await Task.insertMany(tasksToCreate);
            
            // Update project stats immediately
            await this.calculateProjectProgress(project._id);
        }

        return project;
    }

    async updateProject(id, userId, updateData) {
        let project = await this.findById(id);

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        if (project.userId.toString() !== userId) {
            throw new AppError('Not authorized', 401);
        }

        if (updateData.status === 'completed' && project.status !== 'completed') {
            updateData.completedDate = Date.now();
        }

        project = await this.model.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        return project;
    }

    async deleteProject(id, userId, deleteTasks) {
        const project = await this.findById(id);

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        if (project.userId.toString() !== userId) {
            throw new AppError('Not authorized', 401);
        }

        if (deleteTasks === 'true') {
            await Task.deleteMany({ projectId: id });
        } else {
            // Or just unset projectId if keeping tasks as standalone
            await Task.updateMany({ projectId: id }, { $set: { projectId: null } });
        }

        await project.deleteOne();
        return true;
    }

    // Helper to calculate project stats based on tasks
    async calculateProjectProgress(projectId) {
        const tasks = await Task.find({ projectId });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        const totalEstimatedMinutes = tasks.reduce((sum, task) => {
            const minutes = Number(task.estimatedDuration);
            return sum + (Number.isFinite(minutes) ? minutes : 0);
        }, 0);
        const estimatedTotalHours = Number((totalEstimatedMinutes / 60).toFixed(1));

        // A task contributes by its own completion when it has no subtasks,
        // or by subtask completion ratio when subtasks exist.
        const weightedCompletion = tasks.reduce((sum, task) => {
            const subtaskCount = Array.isArray(task.subtasks) ? task.subtasks.length : 0;

            if (subtaskCount === 0) {
                return sum + (task.status === 'done' ? 1 : 0);
            }

            const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;
            return sum + (completedSubtasks / subtaskCount);
        }, 0);

        const progress = totalTasks === 0 ? 0 : Math.round((weightedCompletion / totalTasks) * 100);
        
        let status = 'not-started';
        if (progress > 0 && progress < 100) status = 'in-progress';
        if (progress === 100 && totalTasks > 0) status = 'completed';

        const updateData = {
            totalTasks,
            completedTasks,
            progress,
            status,
            estimatedTotalHours,
        };

        if (status === 'completed') {
            updateData.completedDate = Date.now();
        }

        await this.model.findByIdAndUpdate(projectId, updateData);
        return updateData;
    }
}

module.exports = new ProjectService();
