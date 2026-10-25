import axios from 'axios';

const IS_DEV_PREVIEW = process.env.NEXT_PUBLIC_DEV_PREVIEW === 'true';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,

  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('apex_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (res) => {

    if (res.data?.success === true && res.data.data !== undefined) {
      res.data = res.data.data;
    }
    return res;
  },
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_REVOKED') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('apex_access_token');
        localStorage.removeItem('apex_refresh_token');
        localStorage.removeItem('apex_user');
        if (!IS_DEV_PREVIEW) window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry &&
      !IS_DEV_PREVIEW
    ) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      isRefreshing = true;

      try {
        const refresh = localStorage.getItem('apex_refresh_token');
        const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: refresh,
        });
        const tokenData = refreshRes.data?.data ?? refreshRes.data;
        const newToken = tokenData?.accessToken;
        if (!newToken) throw new Error('No access token in refresh response');

        localStorage.setItem('apex_access_token', newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem('apex_access_token');
        localStorage.removeItem('apex_refresh_token');
        localStorage.removeItem('apex_user');
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
