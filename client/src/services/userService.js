import axios from 'axios';
import { getAuthHeader } from './authService';

const API_URL = 'http://localhost:5000/api';

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update user profile
export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await axios.put(`${API_URL}/users/${userId}`, userData, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Upload user document
export const uploadUserDocument = async (userId, documentType, file) => {
  try {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    
    const response = await axios.post(`${API_URL}/users/${userId}/documents`, formData, {
      ...getAuthHeader(),
      headers: {
        ...getAuthHeader().headers,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Make user an admin (admin only)
export const makeAdmin = async (userId) => {
  try {
    const response = await axios.put(`${API_URL}/users/${userId}/make-admin`, {}, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Verify or reject a user (admin only)
export const verifyUser = async (userId, status, notes) => {
  try {
    const response = await axios.put(`/api/users/${userId}/verify`, { 
      status, 
      notes 
    }, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error verifying user:', error);
    throw error;
  }
};

// Upload documents
export const uploadDocuments = async (formData) => {
  try {
    const config = {
      ...getAuthHeader(),
      headers: {
        ...getAuthHeader().headers,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    const response = await axios.post('/api/users/documents', formData, config);
    return response.data;
  } catch (error) {
    console.error('Error uploading documents:', error);
    throw error;
  }
};

// Submit KYC documents
export const submitKYC = async (aadharCard, panCard, incomeProof) => {
  try {
    const formData = new FormData();
    if (aadharCard) formData.append('aadharCard', aadharCard);
    if (panCard) formData.append('panCard', panCard);
    if (incomeProof) formData.append('incomeProof', incomeProof);
    
    const config = {
      ...getAuthHeader(),
      headers: {
        ...getAuthHeader().headers,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    const response = await axios.post(`${API_URL}/users/kyc`, formData, config);
    return response.data;
  } catch (error) {
    console.error('Error submitting KYC documents:', error);
    throw error.response?.data || error.message;
  }
};