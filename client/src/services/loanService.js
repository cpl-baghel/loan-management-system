import axios from 'axios';
import { getAuthHeader } from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Apply for a loan
export const applyForLoan = async (loanData) => {
  try {
    const res = await axios.post(`${API_URL}/loans`, loanData, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all loans (admin only)
export const getAllLoans = async () => {
  try {
    const res = await axios.get(`${API_URL}/loans`, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get pending loans (admin only)
export const getPendingLoans = async () => {
  try {
    const res = await axios.get(`${API_URL}/loans/pending`, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get user's loans
export const getUserLoans = async () => {
  try {
    const res = await axios.get(`${API_URL}/loans/me`, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get loan by ID
export const getLoanById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/loans/${id}`, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Approve loan (admin only)
export const approveLoan = async (id) => {
  try {
    const res = await axios.put(`${API_URL}/loans/${id}/approve`, {}, getAuthHeader());
    return res.data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('Approve loan error response:', error.response.data);
      throw error.response.data;
    }
    throw error.message || 'Failed to approve loan';
  }
};

// Reject loan (admin only)
export const rejectLoan = async (id, rejectionReason) => {
  try {
    const res = await axios.put(`${API_URL}/loans/${id}/reject`, { rejectionReason }, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}; 