import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API error:', error.response || error);
        return Promise.reject(error);
    }
);

export default api;
