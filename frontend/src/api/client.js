import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export const classifyPrompt = (prompt) =>
  API.post('/classify', { prompt }).then((r) => r.data);

export const getHistory = (limit = 20, offset = 0) =>
  API.get('/history', { params: { limit, offset } }).then((r) => r.data);

export const getStats = () =>
  API.get('/stats').then((r) => r.data);

export const getHealth = () =>
  API.get('/health').then((r) => r.data);

export default API;
