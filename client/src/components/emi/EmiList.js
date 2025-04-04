import React, { useState } from 'react';
import { Table, Badge, Button, Modal, Form, Alert, Row, Col } from 'react-bootstrap';
import { payEmi, manualUpdateEmi } from '../../services/emiService';

// Helper function to format currency in Rupees
const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// EMI status badge component
const EmiStatusBadge = ({ status }) => {
  let variant;
  switch (status) {
    case 'paid':
      variant = 'success';
      break;
    case 'overdue':
      variant = 'danger';
      break;
    case 'pending':
      variant = 'warning';
      break;
    default:
      variant = 'secondary';
  }
  
  return <Badge bg={variant}>{status.toUpperCase()}</Badge>;
};

const EmiList = ({ emis, refreshEmis, isAdmin = false }) => {
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualPaymentData, setManualPaymentData] = useState({
    status: 'paid',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    lateFee: 0
  });

  const handlePayClick = (emi) => {
    setSelectedEmi(emi);
    setPaymentId('');
    setError('');
    setSuccess('');
    setShowPayModal(true);
  };

  const handleManualPayClick = (emi) => {
    setSelectedEmi(emi);
    setError('');
    setSuccess('');
    
    // Calculate default lateFee if overdue
    let defaultLateFee = 0;
    const today = new Date();
    const dueDate = new Date(emi.dueDate);
    
    if (today > dueDate) {
      const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      // 1% of EMI amount per day, capped at 20%
      const feePercentage = Math.min(daysLate * 1, 20);
      defaultLateFee = (emi.amount * feePercentage) / 100;
    }
    
    setManualPaymentData({
      status: 'paid',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentReference: `CASH-${Date.now()}`,
      lateFee: defaultLateFee
    });
    
    setShowManualModal(true);
  };

  const handleCloseModal = () => {
    setShowPayModal(false);
    setShowManualModal(false);
    setSelectedEmi(null);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      await payEmi(selectedEmi._id, paymentId);
      setSuccess('Payment successful!');
      
      // Close modal after 2 seconds and refresh data
      setTimeout(() => {
        handleCloseModal();
        if (refreshEmis) refreshEmis();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualPaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      await manualUpdateEmi(selectedEmi._id, manualPaymentData);
      setSuccess('Payment record updated successfully!');
      
      // Close modal after 2 seconds and refresh data
      setTimeout(() => {
        handleCloseModal();
        if (refreshEmis) refreshEmis();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Update failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualInputChange = (e) => {
    const { name, value } = e.target;
    setManualPaymentData({
      ...manualPaymentData,
      [name]: name === 'lateFee' ? parseFloat(value) : value
    });
  };

  // Check if there's a late fee
  const calculateTotal = (emi) => {
    if (!emi) return 0;
    return (emi.amount || 0) + (emi.lateFee || 0);
  };

  // Check if EMI is due soon (within 7 days)
  const isDueSoon = (dueDate) => {
    if (!dueDate) return false;
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 7;
  };

  return (
    <div>
      {emis.length === 0 ? (
        <p className="text-center my-4">No EMIs found.</p>
      ) : (
        <div className="table-responsive">
          <Table striped hover>
            <thead>
              <tr>
                <th>Due Date</th>
                <th>Amount</th>
                {isAdmin && <th>Customer</th>}
                <th>Status</th>
                <th>Late Fee</th>
                <th>Total</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {emis.map((emi) => (
                <tr key={emi._id} className={isDueSoon(emi.dueDate) && emi.status === 'pending' ? 'table-warning' : ''}>
                  <td>{formatDate(emi.dueDate)}</td>
                  <td>{formatCurrency(emi.amount)}</td>
                  {isAdmin && (
                    <td>{emi.user?.name || 'Unknown'}</td>
                  )}
                  <td><EmiStatusBadge status={emi.status} /></td>
                  <td>{formatCurrency(emi.lateFee || 0)}</td>
                  <td>{formatCurrency(emi.totalPaid || calculateTotal(emi))}</td>
                  {isAdmin && (
                    <td>
                      {emi.status !== 'paid' && (
                        <div className="d-flex gap-2">
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => handleManualPayClick(emi)}
                          >
                            Record Payment
                          </Button>
                        </div>
                      )}
                      {emi.status === 'paid' && (
                        <Badge bg="success">Paid on {formatDate(emi.paidDate)}</Badge>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Payment Modal */}
      <Modal show={showPayModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Make Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <p>Due Date: <strong>{formatDate(selectedEmi?.dueDate)}</strong></p>
          <p>Amount: <strong>{formatCurrency(selectedEmi?.amount)}</strong></p>
          
          {selectedEmi?.status === 'overdue' && (
            <Alert variant="warning">
              This payment is overdue. A late fee may be applied.
            </Alert>
          )}
          
          <Form onSubmit={handlePaymentSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Payment Reference ID (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Enter payment reference"
              />
              <Form.Text className="text-muted">
                If you have a payment confirmation number, enter it here.
              </Form.Text>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Manual Payment Modal (Admin Only) */}
      <Modal show={showManualModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Record Cash Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Alert variant="info">
            <strong>Recording payment for:</strong><br />
            Customer: {selectedEmi?.user?.name || 'Unknown'}<br />
            Due Date: {formatDate(selectedEmi?.dueDate)}<br />
            Amount: {formatCurrency(selectedEmi?.amount)}
          </Alert>
          
          <Form onSubmit={handleManualPaymentSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Payment Status</Form.Label>
              <Form.Control
                as="select"
                name="status"
                value={manualPaymentData.status}
                onChange={handleManualInputChange}
                required
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </Form.Control>
            </Form.Group>
            
            {manualPaymentData.status === 'paid' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="paymentDate"
                    value={manualPaymentData.paymentDate}
                    onChange={handleManualInputChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Payment Reference</Form.Label>
                  <Form.Control
                    type="text"
                    name="paymentReference"
                    value={manualPaymentData.paymentReference}
                    onChange={handleManualInputChange}
                    placeholder="Cash receipt reference"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Late Fee (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="lateFee"
                    value={manualPaymentData.lateFee}
                    onChange={handleManualInputChange}
                    min="0"
                  />
                  <Form.Text className="text-muted">
                    Defaults to calculated late fee based on days overdue.
                  </Form.Text>
                </Form.Group>

                <Row className="mb-3">
                  <Col>
                    <p className="fw-bold">Payment Summary:</p>
                    <p>EMI Amount: {formatCurrency(selectedEmi?.amount || 0)}</p>
                    <p>Late Fee: {formatCurrency(manualPaymentData.lateFee)}</p>
                    <p className="mb-0 fs-5">Total: {formatCurrency((selectedEmi?.amount || 0) + manualPaymentData.lateFee)}</p>
                  </Col>
                </Row>
              </>
            )}
            
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Save Payment Record'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default EmiList; 