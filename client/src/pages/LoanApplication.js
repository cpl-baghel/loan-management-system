import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { applyForLoan } from '../services/loanService';
import LoanCalculator from '../components/loan/LoanCalculator';

const LoanApplication = () => {
  const [formData, setFormData] = useState({
    amount: '100000',
    purpose: '',
    term: '12',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    annualIncome: '500000',
    employmentType: '',
    employmentYears: '',
    aadharCard: null,
    panCard: null,
    incomeCertificate: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [validated, setValidated] = useState(false);

  const navigate = useNavigate();
  const { 
    amount, purpose, term, fullName, email, phone, address, annualIncome, 
    employmentType, employmentYears, aadharCard, panCard, incomeCertificate 
  } = formData;

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.type === 'file' ? e.target.files[0] : e.target.value 
    });
  };

  const nextStep = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setStep(step + 1);
    setValidated(false);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      setIsLoading(false);
      return;
    }

    // Create form data for file uploads
    const formDataToSend = new FormData();
    formDataToSend.append('amount', amount);
    formDataToSend.append('purpose', purpose);
    formDataToSend.append('term', term);
    formDataToSend.append('fullName', fullName);
    formDataToSend.append('email', email);
    formDataToSend.append('phone', phone);
    formDataToSend.append('address', address);
    formDataToSend.append('annualIncome', annualIncome);
    formDataToSend.append('employmentType', employmentType);
    formDataToSend.append('employmentYears', employmentYears);
    
    if (aadharCard) formDataToSend.append('aadharCard', aadharCard);
    if (panCard) formDataToSend.append('panCard', panCard);
    if (incomeCertificate) formDataToSend.append('incomeCertificate', incomeCertificate);

    try {
      // For now, just use the existing loan service (in real app, update to handle FormData)
      const loanData = {
        amount: parseFloat(amount),
        purpose,
        term: parseInt(term)
      };

      await applyForLoan(loanData);
      setSuccess('Loan application submitted successfully! Our team will review your documents and contact you shortly.');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit loan application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Loan Details
  const renderLoanDetailsForm = () => (
    <Form noValidate validated={validated} onSubmit={nextStep}>
      <Form.Group className="mb-3">
        <Form.Label>Loan Amount (₹)</Form.Label>
        <Form.Control
          type="number"
          name="amount"
          value={amount}
          onChange={handleChange}
          placeholder="Enter loan amount"
          min="10000"
          max="1000000"
          required
        />
        <Form.Text className="text-muted">
          Min: ₹10,000 | Max: ₹10,00,000
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Purpose of Loan</Form.Label>
        <Form.Control
          as="select"
          name="purpose"
          value={purpose}
          onChange={handleChange}
          required
        >
          <option value="">Select purpose</option>
          <option value="Home Improvement">Home Improvement</option>
          <option value="Debt Consolidation">Debt Consolidation</option>
          <option value="Education">Education</option>
          <option value="Medical Expenses">Medical Expenses</option>
          <option value="Business">Business</option>
          <option value="Vehicle Purchase">Vehicle Purchase</option>
          <option value="Other">Other</option>
        </Form.Control>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Loan Term: {term} months</Form.Label>
        <Form.Range
          name="term"
          value={term}
          onChange={handleChange}
          min="1"
          max="24"
          required
        />
        <div className="d-flex justify-content-between">
          <small>1 month</small>
          <small>12 months</small>
          <small>24 months</small>
        </div>
      </Form.Group>

      <Alert variant="info" className="mb-3">
        <strong>Note:</strong> We offer competitive interest rates based on your profile and credit history.
      </Alert>

      <Button
        variant="primary"
        type="submit"
        className="w-100 mt-3"
      >
        Next: Personal Information
      </Button>
    </Form>
  );

  // Step 2: Personal Information
  const renderPersonalInfoForm = () => (
    <Form noValidate validated={validated} onSubmit={nextStep}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              name="fullName"
              value={fullName}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="text"
              name="phone"
              value={phone}
              onChange={handleChange}
              pattern="[0-9]{10}"
              required
            />
            <Form.Text className="text-muted">
              10-digit mobile number
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Annual Income (₹)</Form.Label>
            <Form.Control
              type="number"
              name="annualIncome"
              value={annualIncome}
              onChange={handleChange}
              min="100000"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Current Address</Form.Label>
        <Form.Control
          as="textarea"
          name="address"
          value={address}
          onChange={handleChange}
          rows={2}
          required
        />
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Employment Type</Form.Label>
            <Form.Control
              as="select"
              name="employmentType"
              value={employmentType}
              onChange={handleChange}
              required
            >
              <option value="">Select type</option>
              <option value="Salaried">Salaried</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Business Owner">Business Owner</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Other">Other</option>
            </Form.Control>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Years at Current Employment</Form.Label>
            <Form.Control
              as="select"
              name="employmentYears"
              value={employmentYears}
              onChange={handleChange}
              required
            >
              <option value="">Select years</option>
              <option value="< 1 year">Less than 1 year</option>
              <option value="1-3 years">1-3 years</option>
              <option value="3-5 years">3-5 years</option>
              <option value="5-10 years">5-10 years</option>
              <option value="> 10 years">More than 10 years</option>
            </Form.Control>
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" onClick={prevStep}>
          Back
        </Button>
        <Button variant="primary" type="submit">
          Next: Upload Documents
        </Button>
      </div>
    </Form>
  );

  // Step 3: Document Upload
  const renderDocumentUploadForm = () => (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Alert variant="info" className="mb-4">
        <strong>Important:</strong> Please upload clear scanned copies or photos of the following documents. All files must be in JPG, PNG, or PDF format and less than 5MB in size.
      </Alert>

      <Form.Group className="mb-4">
        <Form.Label>Aadhar Card</Form.Label>
        <Form.Control
          type="file"
          name="aadharCard"
          onChange={handleChange}
          accept=".jpg,.jpeg,.png,.pdf"
          required
        />
        <Form.Text className="text-muted">
          Upload front and back side of your Aadhar card as a single file
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>PAN Card</Form.Label>
        <Form.Control
          type="file"
          name="panCard"
          onChange={handleChange}
          accept=".jpg,.jpeg,.png,.pdf"
          required
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Income Proof</Form.Label>
        <Form.Control
          type="file"
          name="incomeCertificate"
          onChange={handleChange}
          accept=".jpg,.jpeg,.png,.pdf"
          required
        />
        <Form.Text className="text-muted">
          Salary slips for the last 3 months (for salaried) or Income Tax Return for last year (for self-employed)
        </Form.Text>
      </Form.Group>

      <div className="d-flex justify-content-between mt-4">
        <Button variant="secondary" onClick={prevStep}>
          Back
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </Form>
  );

  return (
    <Container>
      <Row className="justify-content-center mt-4">
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Loan Application</h3>
                <div>
                  <Badge bg={step === 1 ? "primary" : "secondary"} className="me-1">1</Badge>
                  <Badge bg={step === 2 ? "primary" : "secondary"} className="me-1">2</Badge>
                  <Badge bg={step === 3 ? "primary" : "secondary"}>3</Badge>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {step === 1 && renderLoanDetailsForm()}
              {step === 2 && renderPersonalInfoForm()}
              {step === 3 && renderDocumentUploadForm()}
            </Card.Body>
          </Card>
          
          {/* EMI Calculator */}
          {step === 1 && <LoanCalculator />}
        </Col>
      </Row>
    </Container>
  );
};

export default LoanApplication; 