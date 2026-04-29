const Task = require('../models/Task');

class SchedulerService {
  constructor() {
    this.projectGapMs = 60 * 60 * 1000;
    this.defaultWorkingStart = '09:00';
    this.defaultWorkingEnd = '17:00';
    this.defaultDailyCapacityMinutes = 240;
  }

  parseTimeToMinutes(value, fallback) {
    const rawValue = typeof value === 'string' ? value : fallback;
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(rawValue || '');

    if (!match) {
      const fallbackMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(fallback || '09:00');
      return fallbackMatch ? Number(fallbackMatch[1]) * 60 + Number(fallbackMatch[2]) : 9 * 60;
    }

    return Number(match[1]) * 60 + Number(match[2]);
  }

  addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  setMinutesOfDay(date, minutesOfDay) {
    const next = new Date(date);
    const hours = Math.floor(minutesOfDay / 60);
    const minutes = minutesOfDay % 60;
    next.setHours(hours, minutes, 0, 0);
    return next;
  }

  startOfNextDay(date) {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  normalizeToWorkingWindow(date, startMinutes, endMinutes) {
    const adjusted = new Date(date);
    const currentMinutes = adjusted.getHours() * 60 + adjusted.getMinutes();

    if (currentMinutes < startMinutes) {
      return this.setMinutesOfDay(adjusted, startMinutes);
    }

    if (currentMinutes >= endMinutes) {
      return this.setMinutesOfDay(this.startOfNextDay(adjusted), startMinutes);
    }

    return adjusted;
  }

  getUserPreferences(task) {
    if (task.userId && typeof task.userId === 'object' && task.userId.preferences) {
      return task.userId.preferences;
    }

    return {};
  }

  getWorkingSchedule(task) {
    const preferences = this.getUserPreferences(task);
    const startMinutes = this.parseTimeToMinutes(preferences.workingHours?.start, this.defaultWorkingStart);
    const endMinutes = this.parseTimeToMinutes(preferences.workingHours?.end, this.defaultWorkingEnd);
    const workingWindowMinutes = Math.max(60, endMinutes - startMinutes);
    const dailyCapacityMinutes = Math.max(60, Math.min(workingWindowMinutes, Math.floor(workingWindowMinutes / 2) || this.defaultDailyCapacityMinutes));

    return {
      startMinutes,
      endMinutes,
      dailyCapacityMinutes,
    };
  }

  planTaskAcrossDays(earliestStart, durationMinutes, workingSchedule) {
    let cursor = this.normalizeToWorkingWindow(earliestStart, workingSchedule.startMinutes, workingSchedule.endMinutes);
    let remainingMinutes = durationMinutes;
    let firstStart = null;
    let lastEnd = null;

    while (remainingMinutes > 0) {
      cursor = this.normalizeToWorkingWindow(cursor, workingSchedule.startMinutes, workingSchedule.endMinutes);

      const dayEnd = this.setMinutesOfDay(cursor, workingSchedule.endMinutes);
      const minutesUntilDayEnd = Math.max(0, Math.floor((dayEnd.getTime() - cursor.getTime()) / (60 * 1000)));
      const availableToday = Math.min(workingSchedule.dailyCapacityMinutes, minutesUntilDayEnd);

      if (availableToday <= 0) {
        cursor = this.setMinutesOfDay(this.startOfNextDay(cursor), workingSchedule.startMinutes);
        continue;
      }

      const workMinutes = Math.min(remainingMinutes, availableToday);

      if (!firstStart) {
        firstStart = new Date(cursor);
      }

      lastEnd = this.addMinutes(cursor, workMinutes);
      remainingMinutes -= workMinutes;

      if (remainingMinutes > 0) {
        cursor = this.setMinutesOfDay(this.startOfNextDay(cursor), workingSchedule.startMinutes);
      } else {
        cursor = new Date(lastEnd);
      }
    }

    return {
      start: firstStart,
      end: lastEnd,
      nextCursor: cursor,
    };
  }

  getTaskDurationMinutes(task) {
    const aiDuration = Number(task.aiPredictedDuration);
    if (Number.isFinite(aiDuration) && aiDuration > 0) {
      return aiDuration;
    }

    const estimate = Number(task.estimatedDuration);
    if (Number.isFinite(estimate) && estimate > 0) {
      return estimate;
    }

    return 60;
  }

  getProjectKey(task) {
    if (task.projectId && typeof task.projectId === 'object' && task.projectId._id) {
      return String(task.projectId._id);
    }

    if (task.projectId) {
      return String(task.projectId);
    }

    return 'personal';
  }

  isManuallyLocked(task) {
    return Boolean(task.scheduleLocked && task.scheduleStartAt && task.scheduleEndAt);
  }

  async scheduleUserTasks(userId) {
    const tasks = await Task.find({
      userId,
      status: { $ne: 'done' },
      archivedAt: null,
    })
      .populate('projectId', 'title category status createdAt')
      .populate('userId', 'preferences')
      .sort({ createdAt: 1, order: 1 });

    const taskMap = new Map(tasks.map((task) => [String(task._id), task]));
    const userSchedule = {
      cursor: null,
    };
    const scheduled = [];
    const unscheduled = [];
    const plannedById = new Map();
    const visiting = new Set();

    const scheduleTask = (task) => {
      const taskId = String(task._id);
      if (plannedById.has(taskId)) {
        return plannedById.get(taskId);
      }

      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected for task ${taskId}`);
      }

      visiting.add(taskId);

      const deps = Array.isArray(task.dependencies) ? task.dependencies : [];
      let dependencyEnd = null;
      let dependencyUnscheduled = false;

      for (const dep of deps) {
        const depId = dep && typeof dep === 'object' ? String(dep._id || dep) : String(dep);
        const depTask = taskMap.get(depId);

        if (!depTask) {
          dependencyUnscheduled = true;
          break;
        }

        const plannedDep = scheduleTask(depTask);
        if (!plannedDep || !plannedDep.scheduleStartAt || !plannedDep.scheduleEndAt) {
          dependencyUnscheduled = true;
          break;
        }

        const depEnd = new Date(plannedDep.scheduleEndAt);
        if (!dependencyEnd || depEnd > dependencyEnd) {
          dependencyEnd = depEnd;
        }
      }

      const createdAt = new Date(task.createdAt);
      const workingSchedule = this.getWorkingSchedule(task);

      if (this.isManuallyLocked(task)) {
        const lockedTask = task;
        lockedTask.scheduleDurationMinutes = lockedTask.scheduleDurationMinutes || this.getTaskDurationMinutes(lockedTask);
        lockedTask.scheduleSource = 'manual';
        lockedTask.scheduleUpdatedAt = new Date();
        plannedById.set(taskId, lockedTask);
        scheduled.push(lockedTask);
        const lockedEnd = new Date(lockedTask.scheduleEndAt);
        const nextCursor = new Date(lockedEnd.getTime() + this.projectGapMs);
        if (!userSchedule.cursor || nextCursor > userSchedule.cursor) {
          userSchedule.cursor = nextCursor;
        }
        visiting.delete(taskId);
        return lockedTask;
      }

      if (dependencyUnscheduled) {
        task.scheduleStartAt = null;
        task.scheduleEndAt = null;
        task.scheduleDurationMinutes = null;
        task.scheduleSource = 'auto';
        task.scheduleUpdatedAt = new Date();
        plannedById.set(taskId, task);
        unscheduled.push({ task, reason: 'Blocked by unscheduled dependency' });
        visiting.delete(taskId);
        return task;
      }

      const durationMinutes = this.getTaskDurationMinutes(task);
      let earliestStart = userSchedule.cursor && userSchedule.cursor > createdAt ? new Date(userSchedule.cursor) : new Date(createdAt);
      if (createdAt > earliestStart) {
        earliestStart = new Date(createdAt);
      }
      if (dependencyEnd && dependencyEnd > earliestStart) {
        earliestStart = new Date(dependencyEnd);
      }

      const plannedWindow = this.planTaskAcrossDays(earliestStart, durationMinutes, workingSchedule);

      task.scheduleStartAt = plannedWindow.start;
      task.scheduleEndAt = plannedWindow.end;
      task.scheduleDurationMinutes = durationMinutes;
      task.scheduleSource = 'auto';
      task.scheduleUpdatedAt = new Date();

      plannedById.set(taskId, task);
      scheduled.push(task);

      const nextCursor = new Date(plannedWindow.nextCursor.getTime() + this.projectGapMs);
      if (!userSchedule.cursor || nextCursor > userSchedule.cursor) {
        userSchedule.cursor = nextCursor;
      }

      visiting.delete(taskId);
      return task;
    };

    const orderedTasks = tasks.slice().sort((a, b) => {
      const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
      const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;

      if (deadlineA !== deadlineB) {
        return deadlineA - deadlineB;
      }

      const orderA = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
      const orderB = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    for (const task of orderedTasks) {
      scheduleTask(task);
    }

    await Promise.all(scheduled.map((task) => task.save()));
    await Promise.all(
      unscheduled
        .filter(({ task }) => task.isModified('scheduleStartAt') || task.isModified('scheduleEndAt'))
        .map(({ task }) => task.save())
    );

    return {
      scheduledTasks: scheduled,
      unscheduledTasks: unscheduled.map(({ task, reason }) => ({
        ...task.toObject(),
        reason,
      })),
    };
  }
}

module.exports = new SchedulerService();
