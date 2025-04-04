import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Alert, Table, Button, Modal, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getAllLoans, getPendingLoans, approveLoan, rejectLoan } from '../services/loanService';
import { getAllUsers, makeAdmin } from '../services/userService';
import { getAllEmis, updateOverdueEmis } from '../services/emiService';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import EmiList from '../components/emi/EmiList';
import UserVerificationPanel from '../components/admin/UserVerificationPanel';
import AdminStats from '../components/admin/AdminStats';

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

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loans, setLoans] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoanId, setRejectLoanId] = useState(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [refreshData, setRefreshData] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        if (activeTab === 'dashboard' || activeTab === 'pending' || activeTab === 'all') {
          const pendingData = await getPendingLoans();
          setPendingLoans(pendingData);
        }
        
        if (activeTab === 'dashboard' || activeTab === 'all') {
          const loansData = await getAllLoans();
          setLoans(loansData);
        }
        
        if (activeTab === 'dashboard' || activeTab === 'users') {
          const usersData = await getAllUsers();
          setUsers(usersData);
        }

        if (activeTab === 'dashboard' || activeTab === 'emis') {
          const emisData = await getAllEmis();
          setEmis(emisData);
        }
        
        // No need to fetch verification data here - component handles its own data
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to fetch data: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, refreshData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleApproveLoan = async (loanId) => {
    try {
      await approveLoan(loanId);
      setUpdateSuccess("Loan approved successfully!");
      setRefreshData(!refreshData);
    } catch (err) {
      console.error('Loan approval error:', err);
      if (err.verificationStatus && err.userId) {
        setError(`Cannot approve loan. User needs to be verified first. Current status: ${err.verificationStatus}. Please go to User Verification panel to verify this user.`);
      } else {
        setError(`Failed to approve loan: ${err.message || 'Please try again'}`);
      }
    }
  };

  const prepareRejectLoan = (loanId) => {
    setRejectLoanId(loanId);
    setRejectReason('');
    setShowRejectForm(true);
  };

  const handleRejectLoan = async (e) => {
    e.preventDefault();
    
    if (!rejectLoanId || !rejectReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }
    
    try {
      await rejectLoan(rejectLoanId, rejectReason);
      setShowRejectForm(false);
      setRejectLoanId(null);
      setRejectReason('');
      setRefreshData(!refreshData);
    } catch (err) {
      setError('Failed to reject loan. Please try again.');
      console.error(err);
    }
  };

  const handleMakeAdmin = async (userId) => {
    try {
      await makeAdmin(userId);
      setRefreshData(!refreshData);
    } catch (err) {
      setError('Failed to promote user to admin. Please try again.');
      console.error(err);
    }
  };

  const handleUpdateOverdueEmis = async () => {
    try {
      const result = await updateOverdueEmis();
      setUpdateSuccess(`${result.overdueEmis.length} EMIs marked as overdue.`);
      setTimeout(() => {
        setUpdateSuccess('');
      }, 3000);
      setRefreshData(!refreshData);
    } catch (err) {
      setError('Failed to update overdue EMIs. Please try again.');
      console.error(err);
    }
  };

  // Add a refresh function
  const refreshTabData = () => {
    console.log('Manually refreshing data...');
    setRefreshData(!refreshData);
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={12}>
          <h1 className="mb-4">Admin Dashboard</h1>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {updateSuccess && <Alert variant="success">{updateSuccess}</Alert>}

      {/* Admin Stats */}
      <AdminStats />

      {/* Main Content */}
      <Row className="mt-4">
        <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
          <Col md={3}>
            <Card className="mb-4">
              <Card.Header>
                <h5>Admin Controls</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="dashboard" className="rounded-0">
                      Dashboard
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="verifications" className="rounded-0">
                      User Verifications
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="pending" className="rounded-0">
                      Pending Loans
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="all" className="rounded-0">
                      All Loans
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="emis" className="rounded-0">
                      Manage EMIs
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="users" className="rounded-0">
                      User Management
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
            
            {/* Add refresh button */}
            <Button 
              variant="primary" 
              className="w-100 mb-3"
              onClick={refreshTabData}
            >
              Refresh Data
            </Button>
          </Col>
          <Col md={9}>
            <Tab.Content>
              <Tab.Pane eventKey="dashboard">
                {loading ? (
                  <p className="text-center">Loading dashboard data...</p>
                ) : (
                  <DashboardCharts 
                    loansData={loans} 
                    usersCount={users.length} 
                  />
                )}
              </Tab.Pane>
              
              {/* New User Verification Tab */}
              <Tab.Pane eventKey="verifications">
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4>User Verification Management</h4>
                    <Button 
                      variant="outline-primary" 
                      onClick={refreshTabData}
                    >
                      Refresh Data
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <UserVerificationPanel key={`verification-panel-${refreshData}`} />
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              <Tab.Pane eventKey="pending">
                <Card>
                  <Card.Header>
                    <h4>Pending Loan Applications</h4>
                  </Card.Header>
                  <Card.Body>
                    {loading ? (
                      <p className="text-center">Loading...</p>
                    ) : pendingLoans.length === 0 ? (
                      <p className="text-center">No pending loan applications.</p>
                    ) : (
                      <>
                        <Alert variant="info">
                          <strong>Note:</strong> Users must be verified before their loans can be approved. 
                          Please check the User Verification panel above to verify users.
                        </Alert>
                        <div className="table-responsive">
                          <Table>
                            <thead>
                              <tr>
                                <th>User</th>
                                <th>Amount</th>
                                <th>Term</th>
                                <th>Applied Date</th>
                                <th>Verification Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendingLoans.map(loan => (
                                <tr key={loan._id}>
                                  <td>{loan.user.name}</td>
                                  <td>{formatCurrency(loan.amount)}</td>
                                  <td>{loan.term} months</td>
                                  <td>{formatDate(loan.applicationDate || loan.createdAt)}</td>
                                  <td>
                                    <Badge 
                                      bg={loan.user.verificationStatus === 'verified' ? 'success' : 
                                         loan.user.verificationStatus === 'pending' ? 'warning' : 'danger'}
                                    >
                                      {loan.user.verificationStatus || 'not submitted'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Button
                                      variant="success"
                                      size="sm"
                                      className="me-2"
                                      onClick={() => handleApproveLoan(loan._id)}
                                      disabled={loan.user.verificationStatus !== 'verified'}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => prepareRejectLoan(loan._id)}
                                    >
                                      Reject
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="all">
                <Card>
                  <Card.Header>
                    <h4>All Loans</h4>
                  </Card.Header>
                  <Card.Body>
                    {loading ? (
                      <p className="text-center">Loading...</p>
                    ) : loans.length === 0 ? (
                      <p className="text-center">No loans found.</p>
                    ) : (
                      <div className="table-responsive">
                        <Table>
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Amount</th>
                              <th>Term</th>
                              <th>Status</th>
                              <th>Applied Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loans.map(loan => (
                              <tr key={loan._id}>
                                <td>{loan.user.name}</td>
                                <td>{formatCurrency(loan.amount)}</td>
                                <td>{loan.term} months</td>
                                <td><LoanStatusBadge status={loan.status} /></td>
                                <td>{formatDate(loan.applicationDate || loan.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="emis">
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4>Manage EMIs</h4>
                    <Button
                      variant="warning"
                      onClick={handleUpdateOverdueEmis}
                    >
                      Update Overdue EMIs
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {loading ? (
                      <p className="text-center">Loading EMI data...</p>
                    ) : (
                      <EmiList 
                        emis={emis} 
                        refreshEmis={() => setRefreshData(!refreshData)} 
                        isAdmin={true} 
                      />
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="users">
                <Card>
                  <Card.Header>
                    <h4>User Management</h4>
                  </Card.Header>
                  <Card.Body>
                    {loading ? (
                      <p className="text-center">Loading...</p>
                    ) : users.length === 0 ? (
                      <p className="text-center">No users found.</p>
                    ) : (
                      <div className="table-responsive">
                        <Table>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Verification Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map(user => (
                              <tr key={user._id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                                <td>{user.verificationStatus}</td>
                                <td>
                                  {user.role !== 'admin' && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleMakeAdmin(user._id)}
                                    >
                                      Make Admin
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Tab.Container>
      </Row>

      {/* Reject Loan Modal */}
      <Modal show={showRejectForm} onHide={() => setShowRejectForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Loan Application</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleRejectLoan}>
            <Form.Group>
              <Form.Label>Rejection Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" variant="danger" className="mt-3">
              Confirm Rejection
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminDashboard; 