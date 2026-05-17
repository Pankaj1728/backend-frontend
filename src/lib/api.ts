import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

api.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            error.code = 'ERR_NETWORK';
        }

        if (error.response?.status === 429) {
            error.code = 'ERR_RATE_LIMIT';
            error.message = 'Too many requests. Please wait a moment and try again.';
        }

        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                const { useAuthStore } = await import('./auth');
                useAuthStore.getState().reset();
                window.location.href = '/';
            }
        }

        return Promise.reject(error);
    }
);

export default api;