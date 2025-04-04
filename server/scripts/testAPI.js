const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create an admin token for testing
const generateToken = () => {
  const jwt = require('jsonwebtoken');
  // You should replace this with a valid admin user ID from your database
  return jwt.sign({ id: '67d91bacab9df8e0ae42aef5' }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '1h'
  });
};

const testVerificationsEndpoint = async () => {
  try {
    const token = generateToken();
    console.log('Using test token:', token);
    
    const response = await axios.get('http://localhost:5000/api/admin/verifications', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('API Request Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
};

const testAdminStatsEndpoint = async () => {
  try {
    const token = generateToken();
    
    const response = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Stats API Response Status:', response.status);
    console.log('Stats API Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Stats API Request Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
};

// Run tests
const runTests = async () => {
  console.log('=== Testing Admin Verifications Endpoint ===');
  await testVerificationsEndpoint();
  
  console.log('\n=== Testing Admin Stats Endpoint ===');
  await testAdminStatsEndpoint();
};

runTests(); 