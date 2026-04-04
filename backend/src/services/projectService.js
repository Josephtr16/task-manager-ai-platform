const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const BaseService = require('./BaseService');
const schedulerService = require('./schedulerService');

class ProjectService extends BaseService {
    constructor() {
        super(Project);
    }

    getCollaborator(project, userId) {
        return (project.collaborators || []).find(
            (entry) => entry.user && entry.user.toString() === userId
        );
    }

    getUserProjectAccess(project, userId) {
        const isOwner = project.userId.toString() === userId;
        if (isOwner) {
            return { isOwner: true, hasAccess: true, permission: 'edit' };
        }

        const collaborator = this.getCollaborator(project, userId);
        if (collaborator) {
            return {
                isOwner: false,
                hasAccess: true,
                permission: collaborator.permission || 'complete',
            };
        }

        const isLegacyShared = (project.sharedWith || []).some((uid) => uid.toString() === userId);
        if (isLegacyShared) {
            return {
                isOwner: false,
                hasAccess: true,
                permission: 'complete',
            };
        }

        return { isOwner: false, hasAccess: false, permission: null };
    }

    async getProjects(userId) {
        const projects = await this.model.find({
            $or: [{ userId }, { sharedWith: userId }, { 'collaborators.user': userId }]
        }).sort({ createdAt: -1 });

        return projects.map((projectDoc) => {
            const project = projectDoc.toObject();
            const access = this.getUserProjectAccess(projectDoc, userId);
            project.accessRole = access.isOwner ? 'owner' : 'shared';
            project.myPermission = access.permission;
            return project;
        });
    }

    async getPendingInvites(userId) {
        const projects = await this.model.find({
            shareInvites: {
                $elemMatch: {
                    user: userId,
                    status: 'pending',
                },
            },
        }).sort({ createdAt: -1 }).populate('userId', 'name email');

        return projects.map((projectDoc) => {
            const project = projectDoc.toObject();
            const invite = (project.shareInvites || []).find(
                (item) => item.user && item.user.toString() === userId && item.status === 'pending'
            );

            return {
                ...project,
                inviteStatus: invite ? invite.status : null,
                invitedAt: invite ? invite.invitedAt : null,
                accessRole: 'invite',
                owner: project.userId,
            };
        });
    }

    async getProject(id, userId) {
        const project = await this.findById(id);

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        const access = this.getUserProjectAccess(project, userId);
        if (!access.hasAccess) {
            throw new AppError('Not authorized', 401);
        }

        const collaboratorUserIds = (project.collaborators || []).map((entry) => entry.user);
        const sharedUsers = await User.find({ _id: { $in: collaboratorUserIds } })
            .select('_id name email');

        const pendingInviteUserIds = (project.shareInvites || [])
            .filter((invite) => invite.status === 'pending')
            .map((invite) => invite.user);
        const pendingInviteUsers = pendingInviteUserIds.length > 0
            ? await User.find({ _id: { $in: pendingInviteUserIds } }).select('_id name email')
            : [];

        const pendingInvites = (project.shareInvites || [])
            .filter((invite) => invite.status === 'pending')
            .map((invite) => {
                const user = pendingInviteUsers.find((candidate) => candidate._id.toString() === invite.user.toString());
                return {
                    userId: invite.user,
                    name: user ? user.name : null,
                    email: user ? user.email : null,
                    invitedAt: invite.invitedAt,
                };
            });

        const collaboratorDetails = (project.collaborators || []).map((entry) => {
            const user = sharedUsers.find((candidate) => candidate._id.toString() === entry.user.toString());
            return {
                userId: entry.user,
                permission: entry.permission || 'complete',
                joinedAt: entry.joinedAt,
                name: user ? user.name : null,
                email: user ? user.email : null,
            };
        });

        // Fetch associated tasks - collaborators can view tasks in shared projects
        const tasks = await Task.find({ projectId: id }).sort({ order: 1, createdAt: -1 });

        return {
            project: {
                ...project.toObject(),
                accessRole: access.isOwner ? 'owner' : 'shared',
                myPermission: access.permission,
                collaborators: collaboratorDetails,
                pendingInvites,
            },
            tasks,
        };
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

        await schedulerService.scheduleUserTasks(project.userId);

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

        await schedulerService.scheduleUserTasks(userId);

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

        await schedulerService.scheduleUserTasks(userId);
        return true;
    }

    async shareProject(id, userId, email) {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        if (!normalizedEmail) {
            throw new AppError('Email is required', 400);
        }

        const project = await this.findById(id);

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        // Only the owner can share the project
        if (project.userId.toString() !== userId) {
            throw new AppError('Only the project owner can share it', 401);
        }

        // Find target user
        const targetUser = await User.findOne({ email: normalizedEmail });

        if (!targetUser) {
            throw new AppError('User not found', 404);
        }

        if (targetUser._id.toString() === userId) {
            throw new AppError('Cannot share with yourself', 400);
        }

        // Check if already accepted collaborator
        if ((project.collaborators || []).some((entry) => entry.user.toString() === targetUser._id.toString())) {
            throw new AppError('Project already shared with this user', 400);
        }

        // Check if there is already a pending invite
        const hasPendingInvite = (project.shareInvites || []).some(
            (invite) => invite.user && invite.user.toString() === targetUser._id.toString() && invite.status === 'pending'
        );
        if (hasPendingInvite) {
            throw new AppError('Project already shared with this user', 400);
        }

        // Initialize invite array if needed
        if (!project.shareInvites) {
            project.shareInvites = [];
        }

        project.shareInvites.push({
            user: targetUser._id,
            status: 'pending',
            invitedAt: new Date(),
            respondedAt: null,
        });
        await project.save();

        return {
            id: targetUser._id,
            name: targetUser.name,
            email: targetUser.email,
            status: 'pending',
        };
    }

    async respondToShareInvite(projectId, userId, action) {
        const project = await this.findById(projectId);

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        const invite = (project.shareInvites || []).find(
            (item) => item.user && item.user.toString() === userId && item.status === 'pending'
        );

        if (!invite) {
            throw new AppError('No pending invite found for this project', 404);
        }

        if (action === 'accept') {
            if (!project.sharedWith) {
                project.sharedWith = [];
            }
            if (!project.collaborators) {
                project.collaborators = [];
            }

            const alreadyShared = project.sharedWith.some((uid) => uid.toString() === userId);
            if (!alreadyShared) {
                project.sharedWith.push(userId);
            }

            const alreadyCollaborator = project.collaborators.some((entry) => entry.user.toString() === userId);
            if (!alreadyCollaborator) {
                project.collaborators.push({ user: userId, permission: 'complete', joinedAt: new Date() });
            }

            project.shareInvites = project.shareInvites.filter(
                (item) => !(item.user && item.user.toString() === userId && item.status === 'pending')
            );
            await project.save();

            return { accepted: true };
        }

        if (action === 'decline') {
            invite.status = 'declined';
            invite.respondedAt = new Date();
            await project.save();
            return { declined: true };
        }

        throw new AppError('Invalid action', 400);
    }

    async removeSharedUser(projectId, ownerUserId, targetUserId) {
        const project = await this.findById(projectId);

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        if (project.userId.toString() !== ownerUserId) {
            throw new AppError('Only the project owner can remove collaborators', 401);
        }

        const hadSharedUser = (project.collaborators || []).some((entry) => entry.user.toString() === targetUserId);
        if (!hadSharedUser) {
            throw new AppError('User is not a collaborator on this project', 404);
        }

        project.sharedWith = (project.sharedWith || []).filter((uid) => uid.toString() !== targetUserId);
        project.collaborators = (project.collaborators || []).filter((entry) => entry.user.toString() !== targetUserId);
        await project.save();

        return { removed: true };
    }

    async updateCollaboratorPermission(projectId, ownerUserId, targetUserId, permission) {
        const allowedPermissions = ['view', 'complete', 'edit'];
        if (!allowedPermissions.includes(permission)) {
            throw new AppError('Invalid permission value', 400);
        }

        const project = await this.findById(projectId);

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        if (project.userId.toString() !== ownerUserId) {
            throw new AppError('Only the project owner can update collaborator permissions', 401);
        }

        const collaborator = (project.collaborators || []).find((entry) => entry.user.toString() === targetUserId);
        if (!collaborator) {
            throw new AppError('User is not a collaborator on this project', 404);
        }

        collaborator.permission = permission;
        await project.save();

        return { updated: true, permission };
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
