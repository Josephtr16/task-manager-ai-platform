const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const Task = require('../models/Task');
const schedulerService = require('../services/schedulerService');
const sendResponse = require('../utils/ApiResponse');
const { sanitizeForAI } = require('../utils/sanitizeAIInput');

const router = express.Router();
const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.use(protect);

const getDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const getUserTaskQuery = (userId) => ({
  $or: [
    { userId },
    { sharedWith: userId },
  ],
});

const getTaskMinutes = (task) => {
  if (typeof task.timeTracking?.totalTime === 'number' && task.timeTracking.totalTime > 0) {
    return task.timeTracking.totalTime;
  }

  if (typeof task.actualDuration === 'number' && task.actualDuration > 0) {
    return task.actualDuration;
  }

  if (typeof task.estimatedDuration === 'number' && task.estimatedDuration > 0) {
    return task.estimatedDuration;
  }

  return 0;
};

const SANITIZABLE_FIELDS = new Set(['title', 'description', 'task']);

const sanitizeAIPayloadFields = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAIPayloadFields(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, fieldValue]) => {
      if (SANITIZABLE_FIELDS.has(key.toLowerCase()) && typeof fieldValue === 'string') {
        accumulator[key] = sanitizeForAI(fieldValue);
        return accumulator;
      }

      accumulator[key] = sanitizeAIPayloadFields(fieldValue);
      return accumulator;
    }, {});
  }

  return value;
};

const buildStandupReportPayload = (completedYesterday, dueToday, overdueTasks) => {
  const completedMinutes = completedYesterday.reduce((total, task) => total + getTaskMinutes(task), 0);
  const averageCompletionMinutes = completedYesterday.length > 0
    ? Math.round(completedMinutes / completedYesterday.length)
    : 0;

  return {
    period: 'daily-standup',
    total_tasks: completedYesterday.length + dueToday.length + overdueTasks.length,
    completed: completedYesterday.length,
    overdue: overdueTasks.length,
    average_completion_minutes: averageCompletionMinutes,
    tasks_by_day: {
      yesterday: completedYesterday.length,
    },
    tasks_by_period: {
      due_today: dueToday.length,
      overdue: overdueTasks.length,
    },
  };
};

router.get('/daily-standup', async (req, res) => {
  try {
    const { start: todayStart, end: tomorrowStart } = getDayBounds();
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const accessQuery = getUserTaskQuery(req.user.id);

    const [completedYesterday, dueToday, overdueTasks] = await Promise.all([
      Task.find({
        ...accessQuery,
        status: 'done',
        completedAt: {
          $gte: yesterdayStart,
          $lt: todayStart,
        },
      })
        .sort({ completedAt: -1 })
        .select('title status completedAt actualDuration estimatedDuration timeTracking.totalTime deadline priority category projectId'),
      Task.find({
        ...accessQuery,
        status: { $ne: 'done' },
        deadline: {
          $gte: todayStart,
          $lt: tomorrowStart,
        },
      })
        .sort({ deadline: 1 })
        .select('title status completedAt actualDuration estimatedDuration timeTracking.totalTime deadline priority category projectId'),
      Task.find({
        ...accessQuery,
        status: { $ne: 'done' },
        deadline: { $lt: todayStart },
      })
        .sort({ deadline: 1 })
        .select('title status completedAt actualDuration estimatedDuration timeTracking.totalTime deadline priority category projectId'),
    ]);

    const reportPayload = buildStandupReportPayload(completedYesterday, dueToday, overdueTasks);

    const aiResponse = await axios.post(
      `${AI_SERVICE_BASE_URL}/ai/reports`,
      reportPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return sendResponse(res, 200, true, {
      report: aiResponse.data,
      standup: {
        completedYesterday,
        dueToday,
        overdueTasks,
        counts: {
          completedYesterday: completedYesterday.length,
          dueToday: dueToday.length,
          overdue: overdueTasks.length,
        },
      },
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI service timed out. Please try again.',
      });
    }

    if (error.response) {
      const payload = error.response.data || {};
      if (payload && !payload.message && payload.detail) {
        return res.status(error.response.status).json({
          success: false,
          message: typeof payload.detail === 'string' ? payload.detail : 'AI request failed.',
          detail: payload.detail,
        });
      }
      return res.status(error.response.status).json(payload);
    }

    return res.status(500).json({
      success: false,
      message: 'AI service is unavailable. Please try again shortly.',
    });
  }
});

const proxyEndpoint = (endpoint) => async (req, res) => {
  try {
    const sanitizedBody = sanitizeAIPayloadFields(req.body || {});

    const response = await axios.post(
      `${AI_SERVICE_BASE_URL}/ai/${endpoint}`,
      sanitizedBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI service timed out. Please try again.',
      });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'AI service is unavailable. Please try again shortly.',
    });
  }
};

// Custom proxy with request/response logging for plan-day to aid debugging differences
const planDayProxy = async (req, res) => {
  try {
    const sanitizedBody = sanitizeAIPayloadFields(req.body || {});
    try {
      console.log('[AI PROXY] /plan-day request - user:', req.user?.id, 'body:', JSON.stringify(sanitizedBody));
    } catch (logErr) {
      console.warn('[AI PROXY] failed to stringify request body for logging', logErr?.message || logErr);
    }

    const response = await axios.post(
      `${AI_SERVICE_BASE_URL}/ai/plan-day`,
      sanitizedBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    try {
      // Truncate large responses to keep logs readable
      const respSnippet = JSON.stringify(response.data).slice(0, 4000);
      console.log('[AI PROXY] /plan-day response - status:', response.status, 'bodySnippet:', respSnippet);
    } catch (logErr) {
      console.warn('[AI PROXY] failed to stringify response body for logging', logErr?.message || logErr);
    }

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[AI PROXY] /plan-day error', error?.message || error);
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI service timed out. Please try again.',
      });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'AI service is unavailable. Please try again shortly.',
    });
  }
};

const enhanceProject = async (req, res) => {
  try {
    const { name, description } = sanitizeAIPayloadFields(req.body || {});
    const response = await axios.post(
      `${AI_SERVICE_BASE_URL}/ai/enhance-project`,
      { name, description },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );
    const data = response.data || {};
    return res.status(200).json({
      description: data.description || '',
      estimated_hours: data.estimated_hours || 1,
      category: data.category || 'Work',
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI service timed out. Please try again.',
      });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({
      success: false,
      message: 'AI service is unavailable. Please try again shortly.',
    });
  }
};

const prioritizeTasks = async (req, res) => {
  try {
    const sanitizedBody = sanitizeAIPayloadFields(req.body || {});

    const response = await axios.post(
      `${AI_SERVICE_BASE_URL}/ai/prioritize`,
      sanitizedBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const tasks = Array.isArray(response.data?.tasks) ? response.data.tasks : [];

    for (const task of tasks) {
      if (!task?.id || task.score == null) {
        continue;
      }

      try {
        await Task.findByIdAndUpdate(
          task.id,
          { aiPriorityScore: task.score, aiInsight: task.reason },
          { new: false }
        );
      } catch (dbError) {
        console.warn(`Failed to persist AI priority for task ${task.id}: ${dbError.message}`);
      }
    }

    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI service timed out. Please try again.',
      });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'AI service is unavailable. Please try again shortly.',
    });
  }
};

router.post('/assist-write', aiLimiter, proxyEndpoint('assist-write'));
router.post('/prioritize', aiLimiter, prioritizeTasks);

const predictTime = async (req, res) => {
  let history = [];
  let accuracySummary = {};

  try {
    const completedTasks = await Task.find({
      userId: req.user.id,
      status: 'done',
      actualDuration: { $ne: null },
    })
      .sort({ completedAt: -1 })
      .limit(20)
      .select('title category estimatedDuration actualDuration timeTracking.totalTime');

    history = completedTasks.map((task) => ({
      title: task.title,
      category: task.category || 'Work',
      actual_minutes: task.timeTracking?.totalTime || task.actualDuration || task.estimatedDuration,
    }));

    const ratioSamples = completedTasks
      .filter((task) => task.estimatedDuration && task.estimatedDuration > 0 && task.actualDuration != null)
      .map((task) => task.actualDuration / task.estimatedDuration);

    if (ratioSamples.length > 0) {
      const averageOverrunRatio = ratioSamples.reduce((sum, ratio) => sum + ratio, 0) / ratioSamples.length;
      accuracySummary = {
        average_overrun_ratio: averageOverrunRatio,
        sample_size: ratioSamples.length,
      };
    } else {
      accuracySummary = {
        average_overrun_ratio: null,
        sample_size: 0,
      };
    }
  } catch (dbError) {
    console.warn(`Failed to load task history for AI prediction: ${dbError.message}`);
  }

  const sanitizedInput = sanitizeAIPayloadFields(req.body || {});

  const body = {
    ...sanitizedInput,
    history,
    accuracy_summary: accuracySummary,
  };

  try {
    const response = await axios.post(
      `${AI_SERVICE_BASE_URL}/ai/predict-time`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const taskId = req.body?.taskId;
    if (taskId && response.data?.estimated_minutes != null) {
      try {
        const updatedTask = await Task.findByIdAndUpdate(taskId, {
          aiPredictedDuration: response.data.estimated_minutes,
        }, { new: true });

        if (updatedTask) {
          await schedulerService.scheduleUserTasks(req.user.id);
        }
      } catch (dbError) {
        console.warn(`Failed to persist AI prediction for task ${taskId}: ${dbError.message}`);
      }
    }

    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI service timed out. Please try again.',
      });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'AI service is unavailable. Please try again shortly.',
    });
  }
};

router.post('/predict-time', predictTime);
router.post('/plan-day', aiLimiter, planDayProxy);
router.post('/detect-risks', proxyEndpoint('detect-risks'));
router.post('/reports', proxyEndpoint('reports'));
router.post('/project-breakdown', aiLimiter, proxyEndpoint('project-breakdown'));
router.post('/generate-subtasks', proxyEndpoint('generate-subtasks'));
router.post('/generate-dependencies', proxyEndpoint('generate-dependencies'));
router.post('/enhance-project', enhanceProject);

module.exports = router;
