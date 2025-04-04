import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Register user
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data._id);
      localStorage.setItem('userRole', response.data.role);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data._id);
      localStorage.setItem('userRole', response.data.role);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/me`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get auth header
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

// Check if user is logged in
export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};

// Check if user is admin
export const isAdmin = () => {
  return localStorage.getItem('userRole') === 'admin';
}; 