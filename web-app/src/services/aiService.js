import api from './api';

const AI_BASE_PATH = '/ai';

export const aiService = {
  prioritize: async (tasks) => {
    const response = await api.post(`${AI_BASE_PATH}/prioritize`, { tasks });
    return response.data;
  },

  assistWrite: async ({ title, category, description }) => {
    const response = await api.post(`${AI_BASE_PATH}/assist-write`, {
      title,
      category,
      description,
    });
    return response.data;
  },

  predictTime: async (task) => {
    const response = await api.post(`${AI_BASE_PATH}/predict-time`, {
      task,
    });
    return response.data;
  },

  planDay: async (tasks, workStart, workEnd) => {
    const response = await api.post(`${AI_BASE_PATH}/plan-day`, {
      tasks,
      work_start: workStart,
      work_end: workEnd,
    });
    return response.data;
  },

  detectRisks: async (tasks) => {
    const response = await api.post(`${AI_BASE_PATH}/detect-risks`, { tasks });
    return response.data;
  },

  generateReport: async (stats) => {
    const payload = {
      period: stats.period,
      total_tasks: stats.total_tasks ?? stats.totalTasks,
      completed: stats.completed,
      overdue: stats.overdue,
      average_completion_minutes:
        stats.average_completion_minutes ?? stats.averageCompletionMinutes,
      tasks_by_day: stats.tasks_by_day ?? stats.tasksByDay,
      tasks_by_period: stats.tasks_by_period ?? stats.tasksByPeriod,
    };

    const response = await api.post(`${AI_BASE_PATH}/reports`, payload);
    return response.data;
  },

  projectBreakdown: async (
    name,
    description,
    projectType,
    team,
    scope,
    taskCount,
    projectDeadline
  ) => {
    const payload = {
      name,
      description,
      project_type: projectType,
      team,
      scope,
      task_count: taskCount,
    };

    if (projectDeadline) {
      payload.project_deadline = projectDeadline;
    }

    const response = await api.post(`${AI_BASE_PATH}/project-breakdown`, payload);
    return response.data;
  },

  generateSubtasks: async (
    projectContext,
    taskTitle,
    taskDescription,
    category,
    phase,
    estimatedMinutes
  ) => {
    const response = await api.post(`${AI_BASE_PATH}/generate-subtasks`, {
      project_context: projectContext,
      task_title: taskTitle,
      task_description: taskDescription,
      category,
      phase,
      estimated_minutes: estimatedMinutes,
    });
    return response.data;
  },

  generateDependencies: async (tasks) => {
    const response = await api.post(`${AI_BASE_PATH}/generate-dependencies`, {
      tasks,
    });
    return response.data;
  },
};

export default aiService;
