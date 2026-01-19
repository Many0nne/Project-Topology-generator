import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken, clearAuth } from '../store/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
});

let isRefreshing = false as boolean;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

api.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async (err: unknown) => {
    const error = err as AxiosError;
    const originalRequest = (error.config || {}) as AxiosRequestConfig & { _retry?: boolean };
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            // @ts-expect-error allow headers assignment
            originalRequest.headers = originalRequest.headers || {};
            // @ts-expect-error allow headers assignment
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const resp = await axios.post(
          (import.meta.env.VITE_API_BASE_URL || '') + '/auth/refresh',
          {},
          { withCredentials: true },
        );
        const { accessToken } = resp.data;
        setAccessToken(accessToken);
        onRefreshed(accessToken);
        isRefreshing = false;
        // @ts-expect-error allow headers assignment
        originalRequest.headers = originalRequest.headers || {};
        // @ts-expect-error allow headers assignment
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        clearAuth();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  },
);

export default api;
