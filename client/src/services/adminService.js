import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get all pending verifications
export const getPendingVerifications = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/pending-verifications`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get user documents
export const getUserDocuments = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/admin/user-documents/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get document file
export const getDocumentFile = async (userId, filename) => {
  try {
    const response = await axios.get(`${API_URL}/admin/documents/${filename}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get admin dashboard stats
export const getAdminStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update user verification status
export const updateUserVerification = async (userId, status, notes = '') => {
  try {
    const response = await axios.put(`${API_URL}/admin/verify-user/${userId}`, {
      status,
      notes
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Quick verify a user (admin only)
export const quickVerifyUser = async (userId) => {
  try {
    const response = await axios.post(`${API_URL}/admin/quick-verify`, { userId }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}; 