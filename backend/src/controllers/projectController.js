const projectService = require('../services/projectService');
const mockAIService = require('../services/mockAIService');
const asyncHandler = require('../middleware/asyncHandler');
const sendResponse = require('../utils/ApiResponse');

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
exports.getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjects(req.user.id);

  sendResponse(res, 200, true, {
    count: projects.length,
    projects,
  });
});

// @desc    Get single project with tasks
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = asyncHandler(async (req, res) => {
  const data = await projectService.getProject(req.params.id, req.user.id);

  sendResponse(res, 200, true, data);
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject({
    ...req.body,
    userId: req.user.id,
  });

  sendResponse(res, 201, true, { project });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.user.id, req.body);

  sendResponse(res, 200, true, { project });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = asyncHandler(async (req, res) => {
  const { deleteTasks } = req.query;
  await projectService.deleteProject(req.params.id, req.user.id, deleteTasks);

  sendResponse(res, 200, true, null, 'Project deleted');
});

// @desc    Generate AI task suggestions
// @route   POST /api/projects/ai-suggestions
// @access  Private
exports.generateTaskSuggestions = asyncHandler(async (req, res) => {
  const { title, description, category } = req.body;

  // TODO: Replace with real AI service call to http://localhost:5000/analyze/project
  // For now, we use the mock service
  const useMockAi = process.env.USE_MOCK_AI !== 'false';
  
  let suggestions;
  if (useMockAi) {
    suggestions = await mockAIService.analyzeProject(title, description, category);
  } else {
    // This is where real AI integration would go
    // For now we still fallback to mock if real is not implemented
    suggestions = await mockAIService.analyzeProject(title, description, category);
  }

  sendResponse(res, 200, true, suggestions);
});
