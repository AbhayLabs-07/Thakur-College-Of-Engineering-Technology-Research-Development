import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add JWT authorization token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth Services
export const authService = {
  loginStudent: async (loginId, password) => {
    const res = await API.post('/auth/student/login', { loginId, password });
    return res.data;
  },
  loginFaculty: async (email, password) => {
    const res = await API.post('/auth/faculty/login', { email, password });
    return res.data;
  },
  loginAdmin: async (username, password) => {
    const res = await API.post('/auth/admin/login', { username, password });
    return res.data;
  },
  getProfile: async () => {
    const res = await API.get('/auth/profile');
    return res.data;
  }
};

// Component Services
export const componentService = {
  getAll: async (search = '', category = '') => {
    const res = await API.get(`/components?search=${search}&category=${category}`);
    return res.data;
  },
  getById: async (id) => {
    const res = await API.get(`/components/${id}`);
    return res.data;
  },
  getRecommendations: async (title, domain, description) => {
    const res = await API.post('/components/recommend', { title, domain, description });
    return res.data;
  },
  create: async (data) => {
    const res = await API.post('/components', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await API.put(`/components/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await API.delete(`/components/${id}`);
    return res.data;
  }
};

// Student Services
export const studentService = {
  getMentors: async () => {
    const res = await API.get('/students/mentors');
    return res.data;
  },
  checkout: async (checkoutData) => {
    const res = await API.post('/students/checkout', checkoutData);
    return res.data;
  },
  getHistory: async () => {
    const res = await API.get('/students/history');
    return res.data;
  }
};

// Faculty Services
export const facultyService = {
  getPending: async () => {
    const res = await API.get('/faculty/pending');
    return res.data;
  },
  decide: async (id, approved, remarks) => {
    const res = await API.put(`/faculty/decide/${id}`, { approved, remarks });
    return res.data;
  },
  getRoster: async () => {
    const res = await API.get('/faculty/roster');
    return res.data;
  }
};

// Admin Services
export const adminService = {
  getRecords: async () => {
    const res = await API.get('/admin/records');
    return res.data;
  },
  updateStatus: async (id, status, adminNotes) => {
    const res = await API.put(`/admin/records/${id}/status`, { status, adminNotes });
    return res.data;
  },
  triggerCronScan: async () => {
    const res = await API.post('/cron/trigger-overdue');
    return res.data;
  },
  getExportInventoryUrl: () => `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/export/inventory`,
  getExportCredentialsUrl: () => `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/export/credentials`
};
