const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  generateTaskSuggestions
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/ai-suggestions', generateTaskSuggestions);

router
  .route('/')
  .get(getProjects)
  .post(createProject);

router
  .route('/:id')
  .get(getProject)
  .put(updateProject)
  .patch(updateProject)
  .delete(deleteProject);

module.exports = router;
