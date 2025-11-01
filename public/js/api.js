const API_BASE = 'http://localhost:3000/api';

function getAuthToken() {
    return localStorage.getItem('token');
}

function setAuthToken(token) {
    localStorage.setItem('token', token);
}

function clearAuthToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function setUserInfo(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function getUserInfo() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
}

async function apiCall(endpoint, options = {}) {
    const token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        const isCSVDownload = response.headers.get('Content-Type') === 'text/csv';
        if (isCSVDownload) {
            return response;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;

    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

function handleApiError(error) {
    alert(error.message || 'An error occurred');
}

function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/index.html';
    }
}

function logout() {
    clearAuthToken();
    window.location.href = '/index.html';
}
