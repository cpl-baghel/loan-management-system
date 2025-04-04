import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Nav, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getUserLoans } from '../services/loanService';
import { getUserEmis } from '../services/emiService';
import EmiList from '../components/emi/EmiList';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
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

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [loans, setLoans] = useState([]);
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('loans');
  const [refreshData, setRefreshData] = useState(false);

  // KYC Verification Status Alert Component
  const KycAlert = () => {
    if (!user) return null;
    
    if (user.verificationStatus === 'not_submitted') {
      return (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>KYC Verification Required</Alert.Heading>
          <p>
            Your KYC verification is pending. To apply for loans and access all features, 
            please complete your KYC verification by submitting the required documents.
          </p>
          <div className="d-flex justify-content-end">
            <Link to="/kyc-submission">
              <Button variant="outline-primary">Complete KYC Verification</Button>
            </Link>
          </div>
        </Alert>
      );
    } else if (user.verificationStatus === 'pending') {
      return (
        <Alert variant="info" className="mb-4">
          <Alert.Heading>KYC Verification In Progress</Alert.Heading>
          <p>
            Your KYC documents have been submitted and are currently under review. 
            This process typically takes 1-2 business days. You'll be notified once 
            the verification is complete.
          </p>
        </Alert>
      );
    }
    
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === 'loans' || activeTab === 'emi') {
          const loansData = await getUserLoans();
          setLoans(loansData);
        }
        
        if (activeTab === 'emi') {
          const emisData = await getUserEmis();
          setEmis(emisData);
        }
      } catch (err) {
        setError('Failed to fetch your data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, refreshData]);

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalLoans = loans.length;
    const approvedLoans = loans.filter(loan => loan.status === 'approved').length;
    const pendingLoans = loans.filter(loan => loan.status === 'pending').length;
    const rejectedLoans = loans.filter(loan => loan.status === 'rejected').length;
    
    const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const approvedAmount = loans
      .filter(loan => loan.status === 'approved')
      .reduce((sum, loan) => sum + loan.amount, 0);

    // Get upcoming EMI (nearest due date)
    const pendingEmis = emis.filter(emi => emi.status === 'pending');
    let upcomingEmi = null;
    
    if (pendingEmis.length > 0) {
      upcomingEmi = pendingEmis.reduce((nearest, emi) => {
        if (!nearest) return emi;
        return new Date(emi.dueDate) < new Date(nearest.dueDate) ? emi : nearest;
      }, null);
    }

    return {
      totalLoans,
      approvedLoans,
      pendingLoans,
      rejectedLoans,
      totalAmount,
      approvedAmount,
      upcomingEmi
    };
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Card>
          <Card.Body className="text-center">
            <p>Loading your data...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const summary = calculateSummary();

  return (
    <Container className="py-4">
      <KycAlert />
      
      <Row className="mb-4">
        <Col>
          <h2>Welcome, {user?.name}</h2>
          <p>Manage your loan applications and track their status.</p>
        </Col>
        <Col xs="auto">
          <Button as={Link} to="/apply-loan" variant="primary">
            Apply for New Loan
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100 dashboard-stat-card">
            <Card.Body className="text-center">
              <h6 className="text-muted">Total Loans</h6>
              <h3>{summary.totalLoans}</h3>
              <p className="text-primary mb-0">
                {formatCurrency(summary.totalAmount)}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 dashboard-stat-card">
            <Card.Body className="text-center">
              <h6 className="text-muted">Active Loans</h6>
              <h3>{summary.approvedLoans}</h3>
              <p className="text-success mb-0">
                {formatCurrency(summary.approvedAmount)}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 dashboard-stat-card">
            <Card.Body className="text-center">
              <h6 className="text-muted">Pending Applications</h6>
              <h3>{summary.pendingLoans}</h3>
              <p className="text-warning mb-0">
                {summary.pendingLoans > 0 ? 'Awaiting approval' : 'None pending'}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 dashboard-stat-card">
            <Card.Body className="text-center">
              <h6 className="text-muted">Next Payment Due</h6>
              <h3>
                {summary.upcomingEmi 
                  ? formatCurrency(summary.upcomingEmi.amount) 
                  : 'No payment due'}
              </h3>
              <p className="text-danger mb-0">
                {summary.upcomingEmi 
                  ? formatDate(summary.upcomingEmi.dueDate) 
                  : ''}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <Nav variant="tabs">
                  <Nav.Item>
                    <Nav.Link eventKey="loans">My Loans</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="emi">EMI Payments</Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body>
                <Tab.Content>
                  <Tab.Pane eventKey="loans">
                    {loans.length === 0 ? (
                      <p className="text-center">You haven't applied for any loans yet.</p>
                    ) : (
                      loans.map((loan) => (
                        <Card key={loan._id} className="mb-3">
                          <Card.Body>
                            <Row>
                              <Col>
                                <h5>{loan.purpose}</h5>
                                <p className="mb-1">
                                  <strong>Amount:</strong> {formatCurrency(loan.amount)}
                                </p>
                                <p className="mb-1">
                                  <strong>Term:</strong> {loan.term} months
                                </p>
                                <p className="mb-1">
                                  <strong>Applied on:</strong> {formatDate(loan.applicationDate)}
                                </p>
                                {loan.approvalDate && (
                                  <p className="mb-1">
                                    <strong>Approved on:</strong> {formatDate(loan.approvalDate)}
                                  </p>
                                )}
                                {loan.rejectionReason && (
                                  <p className="mb-1">
                                    <strong>Rejection Reason:</strong> {loan.rejectionReason}
                                  </p>
                                )}
                              </Col>
                              <Col xs="auto" className="d-flex flex-column align-items-end">
                                <LoanStatusBadge status={loan.status} />
                                <div className="mt-auto">
                                  <Button 
                                    as={Link} 
                                    to={`/loans/${loan._id}`} 
                                    variant="outline-primary" 
                                    size="sm"
                                    className="mt-2"
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))
                    )}
                  </Tab.Pane>
                  <Tab.Pane eventKey="emi">
                    {emis.length === 0 ? (
                      <p className="text-center">You don't have any EMI payments scheduled.</p>
                    ) : (
                      <EmiList emis={emis} refreshEmis={() => setRefreshData(!refreshData)} />
                    )}
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default Dashboard; 