import axios from 'axios';

const API_BASE_URL = 'http://localhost:5006/api';
const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (name, email, password, role) => api.post('/auth/register', { name, email, password, role });
export const getProfile = () => api.get('/auth/me');
export const getAllUsers = () => api.get('/auth/users');
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);
export const getSkills = () => api.get('/skills');
export const getMyScores = () => api.get('/my-scores');
export const getHeatmapData = () => api.get('/heatmap');
export const getDashboardStats = () => api.get('/dashboard');
export const getClassPerformance = () => api.get('/class-performance');
export const getAlerts = () => api.get('/alerts');

// Student Management APIs
export const createStudent = (studentData) => api.post('/students', typeof studentData === 'object' ? studentData : { name: arguments[0], email: arguments[1], password: arguments[2] });
export const getAllStudents = () => api.get('/students');
export const getStudentById = (id) => api.get(`/students/${id}`);
export const updateStudent = (id, studentData) => api.put(`/students/${id}`, studentData);
export const deleteStudent = (id) => api.delete(`/students/${id}`);
export const addStudentScores = (studentId, scores) => api.post(`/students/${studentId}/scores`, { studentId, scores });
export const getStudentScores = (id) => api.get(`/students/${id}/scores`);

// Student Profile APIs
export const getStudentSemesterMarks = () => api.get('/student/semester-marks');
export const getStudentSemesterMarksById = (studentId) => api.get(`/student/${studentId}/semester-marks`);
export const addStudentSemesterMarks = (marksData) => api.post('/student/semester-marks', marksData);

// Admin APIs (using existing functions)
export const getAllAdminUsers = () => api.get('/auth/users');
export const deleteAdminUser = (userId) => api.delete(`/auth/users/${userId}`);

// Analytics APIs
export const getAnalyticsOverview = () => api.get('/analytics/overview');
export const getAnalyticsStudents = (params) => api.get('/analytics/students', { params });
export const getStudentAnalyticsProfile = (id) => api.get(`/analytics/students/${id}`);
export const getStudentRisk = (id) => api.get(`/analytics/students/${id}/risk`);
export const getStudentWeakAreas = (id) => api.get(`/analytics/students/${id}/weak-areas`);
export const getStudentRoadmap = (id) => api.get(`/analytics/students/${id}/roadmap`);
export const getSubjectAnalytics = () => api.get('/analytics/subjects');
export const getAttritionAnalytics = () => api.get('/analytics/attrition');
export const getAnalyticsAlerts = () => api.get('/analytics/alerts');
export const markAlertRead = (id) => api.put(`/analytics/alerts/${id}/read`);
export const triggerRecalculate = () => api.post('/analytics/recalculate');

// Intervention APIs
export const getInterventions = (params) => api.get('/interventions', { params });
export const createIntervention = (data) => api.post('/interventions', data);
export const updateIntervention = (id, data) => api.put(`/interventions/${id}`, data);
export const getInterventionById = (id) => api.get(`/interventions/${id}`);
export const getInterventionUpdates = (id) => api.get(`/interventions/${id}/updates`);
export const addInterventionUpdate = (id, data) => api.post(`/interventions/${id}/updates`, data);

export default api;
