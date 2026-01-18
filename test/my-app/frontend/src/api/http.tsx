import axios from 'axios';
import { getAccessToken, setAccessToken, clearAuth } from '../store/useAuthStore';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '', withCredentials: true });

let isRefreshing = false as boolean;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest: any = err.config;
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const resp = await axios.post((import.meta.env.VITE_API_BASE_URL || '') + '/auth/refresh', {}, { withCredentials: true });
        const { accessToken } = resp.data;
        setAccessToken(accessToken);
        onRefreshed(accessToken);
        isRefreshing = false;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        clearAuth();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
