const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');

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

router.post('/prioritize', proxyEndpoint('prioritize'));
router.post('/assist-write', proxyEndpoint('assist-write'));
router.post('/predict-time', proxyEndpoint('predict-time'));
router.post('/plan-day', proxyEndpoint('plan-day'));
router.post('/detect-risks', proxyEndpoint('detect-risks'));
router.post('/reports', proxyEndpoint('reports'));
router.post('/project-breakdown', proxyEndpoint('project-breakdown'));
router.post('/generate-subtasks', proxyEndpoint('generate-subtasks'));
router.post('/enhance-project', enhanceProject);

module.exports = router;
