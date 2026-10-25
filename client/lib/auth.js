import api from './api';

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('apex_access_token', data.accessToken);
  localStorage.setItem('apex_refresh_token', data.refreshToken);
  localStorage.setItem('apex_user', JSON.stringify(data.user));
  return data;
};

export const register = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  localStorage.setItem('apex_access_token', data.accessToken);
  localStorage.setItem('apex_refresh_token', data.refreshToken);
  localStorage.setItem('apex_user', JSON.stringify(data.user));
  return data;
};

export const logout = () => {

  const token = typeof window !== 'undefined' ? localStorage.getItem('apex_access_token') : null;
  if (token) {
    api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  }
  localStorage.removeItem('apex_access_token');
  localStorage.removeItem('apex_refresh_token');
  localStorage.removeItem('apex_user');

  if (typeof window !== 'undefined') sessionStorage.setItem('apex_dev_no_seed', '1');
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('apex_user')); } catch { return null; }
};

export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('apex_access_token');
};
