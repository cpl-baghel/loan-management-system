const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = null;

// Function to log responses or errors
const logResponse = (name, response) => {
  console.log(`\n--- ${name} Response ---`);
  console.log('Status:', response.status);
  console.log('Data:', JSON.stringify(response.data, null, 2));
};

const logError = (name, error) => {
  console.error(`\n!!! ${name} Error !!!`);
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  } else {
    console.error('Error:', error.message);
  }
};

// Login as admin
const login = async () => {
  try {
    console.log('Logging in as admin...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'adminpassword'
    });
    
    token = response.data.token;
    logResponse('Login', response);
    
    return token;
  } catch (error) {
    logError('Login', error);
    process.exit(1);
  }
};

// Get admin stats
const getAdminStats = async () => {
  try {
    console.log('\nFetching admin stats...');
    const response = await axios.get(`${API_URL}/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    logResponse('Admin Stats', response);
  } catch (error) {
    logError('Admin Stats', error);
  }
};

// Get pending verifications
const getPendingVerifications = async () => {
  try {
    console.log('\nFetching pending verifications...');
    const response = await axios.get(`${API_URL}/admin/pending-verifications`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    logResponse('Pending Verifications', response);
  } catch (error) {
    logError('Pending Verifications', error);
  }
};

// Get all loans
const getAllLoans = async () => {
  try {
    console.log('\nFetching all loans...');
    const response = await axios.get(`${API_URL}/loans`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    logResponse('All Loans', response);
  } catch (error) {
    logError('All Loans', error);
  }
};

// Get pending loans
const getPendingLoans = async () => {
  try {
    console.log('\nFetching pending loans...');
    const response = await axios.get(`${API_URL}/loans/pending`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    logResponse('Pending Loans', response);
  } catch (error) {
    logError('Pending Loans', error);
  }
};

// Get all EMIs
const getAllEmis = async () => {
  try {
    console.log('\nFetching all EMIs...');
    const response = await axios.get(`${API_URL}/emis`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    logResponse('All EMIs', response);
  } catch (error) {
    logError('All EMIs', error);
  }
};

// Get all users
const getAllUsers = async () => {
  try {
    console.log('\nFetching all users...');
    const response = await axios.get(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    logResponse('All Users', response);
  } catch (error) {
    logError('All Users', error);
  }
};

// Run the tests
const runTests = async () => {
  try {
    await login();
    await getAdminStats();
    await getPendingVerifications();
    await getAllLoans();
    await getPendingLoans();
    await getAllEmis();
    await getAllUsers();
    
    console.log('\n=== All tests completed ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

runTests(); 