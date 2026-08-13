import api from './client';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (credential) => api.post('/auth/google', { credential }),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  getSkills: () => api.get('/users/me/skills'),
};

export const resumeApi = {
  upload: (formData) => api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  list: () => api.get('/resumes'),
  getAnalysis: (id) => api.get(`/resumes/${id}/analysis`),
  triggerATS: (id) => api.post(`/resumes/${id}/ats-scan`),
};

export const skillsApi = {
  analyzeGap: (data) => api.post('/skills/analyze-gap', data),
  getRecommendations: () => api.get('/skills/recommendations'),
};

export const roadmapApi = {
  generate: (data) => api.post('/roadmaps/generate', data),
  list: () => api.get('/roadmaps'),
  updateMilestone: (roadmapId, milestoneId, data) =>
    api.patch(`/roadmaps/${roadmapId}/milestones/${milestoneId}`, data),
};

export const interviewApi = {
  start: (data) => api.post('/interviews/start', data),
  submitAnswer: (sessionId, data) => api.post(`/interviews/${sessionId}/answer`, data),
  getFeedback: (sessionId) => api.get(`/interviews/${sessionId}/feedback`),
};

export const chatApi = {
  sendMessage: (data) => api.post('/chat/message', data),
  getHistory: () => api.get('/chat/history'),
};

export const progressApi = {
  getDashboard: () => api.get('/progress/dashboard'),
  getWeeklyReport: () => api.get('/progress/weekly-report'),
};
