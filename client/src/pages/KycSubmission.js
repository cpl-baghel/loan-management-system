import React, { useState, useContext, useEffect } from 'react';
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const KycSubmission = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    aadharId: '',
    panId: '',
    incomeProofId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Use effect to handle redirects based on authentication and verification status
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Redirect if already verified or pending verification
    if (user.verificationStatus === 'verified' || user.verificationStatus === 'pending') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.aadharId || !formData.panId || !formData.incomeProofId) {
      setError('Please fill in all document ID fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/users/kyc-simplified`, 
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setSuccess('Document IDs submitted successfully. Your KYC verification is pending review.');
      
      // Update the user context with new verification status
      setUser({
        ...user,
        verificationStatus: 'pending'
      });
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // If auth context is still loading or no user exists, don't render the form yet
  if (!user) {
    return null;
  }
  
  return (
    <Container className="py-5">
      <Card>
        <Card.Header as="h4" className="text-center bg-primary text-white">
          KYC Verification
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Card.Text className="mb-4">
            To continue with our services, we need to verify your identity. Please provide the following document IDs:
          </Card.Text>
          
          <Form onSubmit={handleSubmit}>
            <Row className="mb-4">
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Aadhar Card Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="aadharId"
                    value={formData.aadharId}
                    onChange={handleChange}
                    placeholder="Enter 12-digit Aadhar number"
                    maxLength={12}
                    required
                  />
                  <Form.Text className="text-muted">
                    Your 12-digit unique Aadhar identification number
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>PAN Card Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="panId"
                    value={formData.panId}
                    onChange={handleChange}
                    placeholder="Enter 10-character PAN"
                    maxLength={10}
                    required
                  />
                  <Form.Text className="text-muted">
                    Your 10-character Permanent Account Number
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Income Proof Reference</Form.Label>
                  <Form.Control
                    type="text"
                    name="incomeProofId"
                    value={formData.incomeProofId}
                    onChange={handleChange}
                    placeholder="Enter income document reference"
                    required
                  />
                  <Form.Text className="text-muted">
                    Tax filing number or salary slip reference
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="text-center mt-4">
              <Button 
                type="submit" 
                variant="primary" 
                size="lg"
                disabled={loading || !formData.aadharId || !formData.panId || !formData.incomeProofId}
                className="px-5"
              >
                {loading ? 'Submitting...' : 'Submit Document IDs'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default KycSubmission;