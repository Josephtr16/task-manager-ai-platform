const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');
const schedulerService = require('../services/schedulerService');

const router = express.Router();
const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.use(protect);

const proxyEndpoint = (endpoint) => async (req, res) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_BASE_URL}/ai/${endpoint}`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
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
    const { name, description } = req.body || {};
    const response = await axios.post(
      `${AI_SERVICE_BASE_URL}/ai/enhance-project`,
      { name, description },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = response.data || {};
    return res.status(200).json({
      description: data.description || '',
      estimated_hours: data.estimated_hours || 1,
      category: data.category || 'Work',
    });
  } catch (error) {
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
    const response = await axios.post(
      `${AI_SERVICE_BASE_URL}/ai/prioritize`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
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
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'AI service is unavailable. Please try again shortly.',
    });
  }
};

router.post('/assist-write', proxyEndpoint('assist-write'));
router.post('/prioritize', prioritizeTasks);

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

  const body = {
    ...req.body,
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
router.post('/plan-day', proxyEndpoint('plan-day'));
router.post('/detect-risks', proxyEndpoint('detect-risks'));
router.post('/reports', proxyEndpoint('reports'));
router.post('/project-breakdown', proxyEndpoint('project-breakdown'));
router.post('/generate-subtasks', proxyEndpoint('generate-subtasks'));
router.post('/enhance-project', enhanceProject);

module.exports = router;
