import axios from 'axios';

/**
 * Axios instance customized for IPB Space API
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Standard response: { success: boolean, data: any }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    // CRITICAL FIX: Only treat 401 (Unauthorized) as a token/auth error.
    // 403 (Forbidden) means the user IS authenticated but lacks ROLE permissions —
    // this must NOT trigger a logout or token refresh cycle.
    const isTokenExpired = error.response?.status === 401;
    const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');

    if (isTokenExpired && !isAuthRoute && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, null, {
            params: {
              refresh_token: refreshToken
            }
          });
          
          if (res.data?.success && res.data?.data?.token?.access_token) {
            const newAccessToken = res.data.data.token.access_token;
            localStorage.setItem('access_token', newAccessToken);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
      }
      
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
