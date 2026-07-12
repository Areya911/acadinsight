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
export const createStudent = (name, email, password) => api.post('/students', { name, email, password });
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

export default api;
