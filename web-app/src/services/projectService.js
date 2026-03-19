import api from './api';

const API_URL = '/projects';

// Get all user projects
const getProjects = async (token) => {
    // Note: token is automatically attached by api interceptor
    const response = await api.get(API_URL);
    return response.data.projects;
};

// Get single project
const getProject = async (projectId, token) => {
    const response = await api.get(`${API_URL}/${projectId}`);
    return response.data;
};

// Create new project
const createProject = async (projectData, token) => {
    const response = await api.post(API_URL, projectData);
    return response.data.project;
};

// Update project
const updateProject = async (projectId, projectData, token) => {
    const response = await api.put(`${API_URL}/${projectId}`, projectData);
    return response.data.project;
};

// Delete project
const deleteProject = async (projectId, token, deleteTasks = false) => {
    const response = await api.delete(`${API_URL}/${projectId}`, {
        params: { deleteTasks }
    });
    return response.data;
};

// Get AI suggestions for project
const getAISuggestions = async (projectData) => {
    const response = await api.post(`${API_URL}/ai-suggestions`, projectData);
    return response.data;
};

const projectService = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
};

export default projectService;
