import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 100000,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('smartreach-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
