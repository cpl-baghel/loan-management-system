import axios from 'axios';
import { getAuthHeader } from './authService';

const API_URL = 'http://localhost:5000/api';

// Get user's EMIs
export const getUserEmis = async () => {
  try {
    const res = await axios.get(`${API_URL}/emis/me`, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get loan EMIs
export const getLoanEmis = async (loanId) => {
  try {
    const res = await axios.get(`${API_URL}/emis/loan/${loanId}`, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Pay EMI
export const payEmi = async (emiId, paymentId) => {
  try {
    const res = await axios.put(`${API_URL}/emis/${emiId}/pay`, { paymentId }, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all EMIs (admin only)
export const getAllEmis = async () => {
  try {
    const res = await axios.get(`${API_URL}/emis`, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update overdue EMIs (admin only)
export const updateOverdueEmis = async () => {
  try {
    const res = await axios.get(`${API_URL}/emis/update-overdue`, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Manually update EMI payment status (admin only)
export const manualUpdateEmi = async (emiId, updateData) => {
  try {
    const res = await axios.put(`${API_URL}/emis/${emiId}/manual-update`, updateData, getAuthHeader());
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}; 