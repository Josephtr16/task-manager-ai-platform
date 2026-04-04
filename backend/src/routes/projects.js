const express = require('express');
const router = express.Router();
const {
  getProjects,
  getPendingInvites,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  generateTaskSuggestions,
  shareProject,
  respondToProjectShare,
  removeSharedUser,
  updateCollaboratorPermission
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/ai-suggestions', generateTaskSuggestions);
router.get('/invites', getPendingInvites);

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

router.post('/:id/share', shareProject);
router.post('/:id/respond-share', respondToProjectShare);
router.delete('/:id/share/:userId', removeSharedUser);
router.patch('/:id/share/:userId/permission', updateCollaboratorPermission);

module.exports = router;
