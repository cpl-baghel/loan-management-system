import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getLoanById } from '../services/loanService';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Calculate monthly payment
const calculateMonthlyPayment = (amount, interestRate, term) => {
  const monthlyRate = interestRate / 100 / 12;
  const payment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
  return payment.toFixed(2);
};

// Loan status badge component
const LoanStatusBadge = ({ status }) => {
  let variant;
  switch (status) {
    case 'approved':
      variant = 'success';
      break;
    case 'rejected':
      variant = 'danger';
      break;
    case 'pending':
      variant = 'warning';
      break;
    case 'paid':
      variant = 'primary';
      break;
    default:
      variant = 'secondary';
  }
  
  return <Badge bg={variant}>{status.toUpperCase()}</Badge>;
};

const LoanDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        const data = await getLoanById(id);
        setLoan(data);
      } catch (err) {
        setError('Failed to fetch loan details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanDetails();
  }, [id]);

  if (loading) {
    return (
      <Container className="mt-4">
        <Card>
          <Card.Body className="text-center">
            <p>Loading loan details...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to="/dashboard" variant="primary">
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!loan) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Loan not found</Alert>
        <Button as={Link} to="/dashboard" variant="primary">
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const monthlyPayment = loan.status === 'approved' 
    ? calculateMonthlyPayment(loan.amount, loan.interestRate, loan.term) 
    : 0;

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Loan Details</h3>
          <LoanStatusBadge status={loan.status} />
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h4 className="mb-3">Loan Information</h4>
              <p><strong>Purpose:</strong> {loan.purpose}</p>
              <p><strong>Amount:</strong> {formatCurrency(loan.amount)}</p>
              <p><strong>Term:</strong> {loan.term} months</p>
              {loan.status === 'approved' && (
                <>
                  <p><strong>Interest Rate:</strong> {loan.interestRate}%</p>
                  <p><strong>Monthly Payment:</strong> {formatCurrency(monthlyPayment)}</p>
                  <p><strong>Total Payment:</strong> {formatCurrency(monthlyPayment * loan.term)}</p>
                </>
              )}
            </Col>
            <Col md={6}>
              <h4 className="mb-3">Application Status</h4>
              <p><strong>Application Date:</strong> {formatDate(loan.applicationDate)}</p>
              {loan.approvalDate && (
                <p><strong>Approval Date:</strong> {formatDate(loan.approvalDate)}</p>
              )}
              {loan.approvedBy && (
                <p><strong>Processed By:</strong> {loan.approvedBy.name}</p>
              )}
              {loan.rejectionReason && (
                <div>
                  <p><strong>Rejection Reason:</strong></p>
                  <Alert variant="secondary">
                    {loan.rejectionReason}
                  </Alert>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer>
          <Button as={Link} to="/dashboard" variant="primary">
            Back to Dashboard
          </Button>
          {user?.role === 'admin' && (
            <Button as={Link} to="/admin" variant="outline-primary" className="ms-2">
              Back to Admin Panel
            </Button>
          )}
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default LoanDetails; 