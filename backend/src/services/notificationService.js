const Task = require('../models/Task');
const Notification = require('../models/Notification');

class NotificationService {
  async generateDeadlineNotifications(userId) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const maxLeadDays = 3;
    const maxWindowEnd = new Date(now.getTime() + maxLeadDays * 24 * 60 * 60 * 1000);

    const candidateTasks = await Task.find({
      userId,
      status: { $ne: 'done' },
      // Pull up to the max lead-time horizon, then apply per-task lead windows below.
      deadline: { $gte: startOfToday, $lte: maxWindowEnd },
    }).select('_id title deadline projectId estimatedDuration aiPredictedDuration');

    const dueSoonTasks = candidateTasks.filter((task) => {
      if (!task.deadline) {
        return false;
      }

      const durationMinutes = Number(task.aiPredictedDuration || task.estimatedDuration || 60);

      // Longer tasks get earlier reminders.
      let leadDays = 1;
      if (durationMinutes >= 360) {
        leadDays = 3;
      } else if (durationMinutes >= 180) {
        leadDays = 2;
      }

      const leadWindowEnd = new Date(now.getTime() + leadDays * 24 * 60 * 60 * 1000);
      return task.deadline >= startOfToday && task.deadline <= leadWindowEnd;
    });

    if (!dueSoonTasks.length) {
      return 0;
    }

    const taskIds = dueSoonTasks.map((task) => task._id);

    const existingNotifications = await Notification.find({
      userId,
      type: 'deadline_soon',
      taskId: { $in: taskIds },
    }).select('taskId');

    const alreadyNotifiedTaskIds = new Set(
      existingNotifications.map((n) => String(n.taskId))
    );

    const notificationsToCreate = dueSoonTasks
      .filter((task) => !alreadyNotifiedTaskIds.has(String(task._id)))
      .map((task) => {
        const durationMinutes = Number(task.aiPredictedDuration || task.estimatedDuration || 60);

        let leadDays = 1;
        if (durationMinutes >= 360) {
          leadDays = 3;
        } else if (durationMinutes >= 180) {
          leadDays = 2;
        }

        const message = leadDays === 1
          ? `Task "${task.title}" is due within 24 hours.`
          : `Task "${task.title}" is due within ${leadDays} days.`;

        return {
          userId,
          type: 'deadline_soon',
          message,
          taskId: task._id,
          projectId: task.projectId || null,
          read: false,
        };
      });

    if (!notificationsToCreate.length) {
      return 0;
    }

    await Notification.insertMany(notificationsToCreate);
    return notificationsToCreate.length;
  }
}

module.exports = new NotificationService();
