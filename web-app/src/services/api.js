// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Unwrap response data
api.interceptors.response.use(
  (response) => {
    // If the response follows our standard format { success: true, data: ... }
    if (response.data && response.data.success && response.data.data) {
      // Return the inner data as the response.data
      // We keep the original response object but replace data
      response.data = response.data.data;
    } else if (response.data && response.data.success) {
      // If success is true but no data (e.g. DELETE), return empty object or message
      // useful for things like { success: true, message: "Deleted" }
      response.data = response.data;
    }
    return response;
  },
  (error) => {
    // Extract error message from our standard error format
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Tasks API
export const tasksAPI = {
  getTasks: () => api.get('/tasks'),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getStatistics: () => api.get('/tasks/statistics'),
  getUpcoming: () => api.get('/tasks/upcoming'),
  // New features
  addAttachment: (id, formData) => api.post(`/tasks/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text }),
  shareTask: (id, email) => api.post(`/tasks/${id}/share`, { email }),
};

// Time Tracking API
export const timeTrackingAPI = {
  startTimer: (taskId) => api.post(`/tasks/${taskId}/start-timer`),
  stopTimer: (taskId) => api.post(`/tasks/${taskId}/stop-timer`),
  getTimerStatus: (taskId) => api.get(`/tasks/${taskId}/timer-status`),
  getTimeLogs: (taskId) => api.get(`/tasks/${taskId}/time-logs`),
  deleteTimeLog: (taskId, sessionId) => api.delete(`/tasks/${taskId}/time-logs/${sessionId}`),
};

// Subtasks API
export const subtasksAPI = {
  getSubtasks: (taskId) => api.get(`/tasks/${taskId}/subtasks`),
  addSubtask: (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data),
  updateSubtask: (taskId, subtaskId, data) => api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, data),
  toggleSubtask: (taskId, subtaskId) => api.put(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`),
  deleteSubtask: (taskId, subtaskId) => api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
};

// Analytics API
export const analyticsAPI = {
  getProductivityTrend: (days = 7) => api.get(`/analytics/productivity-trend?days=${days}`),
  getCategoryDistribution: () => api.get('/analytics/category-distribution'),
  getTimeOfDay: () => api.get('/analytics/time-of-day'),
  getPerformanceMetrics: () => api.get('/analytics/performance-metrics'),
  getBestDays: () => api.get('/analytics/best-days'),
  getAIInsights: () => api.get('/analytics/ai-insights'),
  getCompletionRate: (days = 30) => api.get(`/analytics/completion-rate?days=${days}`),
};

export default api;