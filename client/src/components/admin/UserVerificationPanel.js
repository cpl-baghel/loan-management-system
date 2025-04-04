import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Image, Row, Col, Form, Alert, ButtonGroup, Tabs, Tab } from 'react-bootstrap';
import { getPendingVerifications, getUserDocuments, updateUserVerification, quickVerifyUser } from '../../services/adminService';
import { uploadUserDocument } from '../../services/userService';

const UserVerificationPanel = () => {
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [documents, setDocuments] = useState({});
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentType, setDocumentType] = useState('aadharCard');
  const [documentFile, setDocumentFile] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    console.log('UserVerificationPanel mounted, fetching data...');
    fetchAllUsers();
  }, []);

  // Watch for changes in the allUsers array or statusFilter and update filteredUsers
  useEffect(() => {
    filterUsers();
  }, [allUsers, statusFilter, activeTab]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Calling getPendingVerifications...');
      const data = await getPendingVerifications();
      console.log('Received all users:', data);
      setAllUsers(data || []);
      
      // Initial filtering
      filterUsers();
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...allUsers];
    
    // Sort users by verification status - pending and not_submitted first
    filtered.sort((a, b) => {
      const order = { 'pending': 0, 'not_submitted': 1, 'rejected': 2, 'verified': 3 };
      return order[a.verificationStatus] - order[b.verificationStatus];
    });

    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(user => 
        user.verificationStatus === 'pending' || 
        user.verificationStatus === 'not_submitted' || 
        user.verificationStatus === 'rejected'
      );
    } else if (activeTab === 'verified') {
      filtered = filtered.filter(user => user.verificationStatus === 'verified');
    }
    
    setFilteredUsers(filtered);
  };

  // View user documents
  const handleViewDocuments = async (userId) => {
    try {
      setError(null);
      console.log('Fetching documents for user:', userId);
      const docs = await getUserDocuments(userId);
      console.log('Received documents:', docs);
      setDocuments(docs);
      setSelectedUser(allUsers.find(user => user._id === userId));
      
      // Check if user has no documents
      const user = allUsers.find(u => u._id === userId);
      if (user && user.verificationStatus === 'not_submitted') {
        setError('This user has not submitted verification documents yet but has loan applications. They need to upload documents before verification.');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to fetch user documents: ' + (err.message || JSON.stringify(err)));
    }
  };

  // View a specific document
  const handleViewDocument = (docType, filename) => {
    if (!filename) return;
    
    setCurrentDocument({
      type: docType,
      filename: filename,
      userId: selectedUser._id
    });
    setShowDocumentModal(true);
  };

  const handleVerification = async (status) => {
    if (!selectedUser) return;

    try {
      setError(null);
      await updateUserVerification(selectedUser._id, status, verificationNotes);
      setSuccess(`User ${selectedUser.name} has been ${status === 'verified' ? 'approved' : 'rejected'}`);
      
      // Update the user in the allUsers array
      const updatedUsers = allUsers.map(user => {
        if (user._id === selectedUser._id) {
          return { ...user, verificationStatus: status };
        }
        return user;
      });
      
      setAllUsers(updatedUsers);
      
      // Close user view after verification
      setSelectedUser(null);
      setVerificationNotes('');
    } catch (err) {
      setError('Failed to update verification status: ' + (err.message || 'Unknown error'));
      console.error(err);
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!selectedUser || !documentFile) return;

    try {
      setError(null);
      setUploadingDocument(true);
      
      await uploadUserDocument(selectedUser._id, documentType, documentFile);
      
      setSuccess(`${documentType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} uploaded successfully`);
      setDocumentFile(null);
      
      // Refresh documents after upload
      const docs = await getUserDocuments(selectedUser._id);
      setDocuments(docs);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document: ' + (err.message || JSON.stringify(err)));
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleFileChange = (e) => {
    setDocumentFile(e.target.files[0]);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleQuickVerify = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      await quickVerifyUser(userId);
      setSuccess("User has been quickly verified!");
      
      // Update the user in the allUsers array to show the change immediately
      const updatedUsers = allUsers.map(user => {
        if (user._id === userId) {
          return { ...user, verificationStatus: 'verified' };
        }
        return user;
      });
      
      setAllUsers(updatedUsers);
      filterUsers(); // Re-filter the users list
    } catch (err) {
      console.error('Error quick verifying user:', err);
      setError('Failed to verify user: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      {loading ? (
        <p className="text-center">Loading verification data...</p>
      ) : selectedUser ? (
        <div>
          <h5>Reviewing: {selectedUser.name}</h5>
          <p><strong>Email:</strong> {selectedUser.email}</p>
          <p><strong>Phone:</strong> {selectedUser.phone}</p>
          <p><strong>Status:</strong> <Badge bg={
            selectedUser.verificationStatus === 'pending' ? 'warning' : 
            selectedUser.verificationStatus === 'verified' ? 'success' : 
            selectedUser.verificationStatus === 'not_submitted' ? 'secondary' : 'danger'
          }>
            {selectedUser.verificationStatus === 'not_submitted' ? 'Not Submitted' : selectedUser.verificationStatus}
          </Badge></p>
          <p><strong>Loan Applications:</strong> {selectedUser.loanCount}</p>
          
          {/* Display a notice if the user hasn't uploaded documents */}
          {!documents.aadharCard && !documents.panCard && !documents.incomeProof && (
            <Alert variant="warning">
              <h6>No Documents Uploaded</h6>
              <p>This user has not uploaded any verification documents yet. They need to upload their documents before you can verify them.</p>
              <p>As an admin, you can upload documents on behalf of the user:</p>
              
              <Form onSubmit={handleDocumentUpload}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Document Type</Form.Label>
                      <Form.Select 
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                      >
                        <option value="aadharCard">Aadhar Card</option>
                        <option value="panCard">PAN Card</option>
                        <option value="incomeProof">Income Proof</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>File</Form.Label>
                      <Form.Control 
                        type="file" 
                        onChange={handleFileChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="mb-3 w-100"
                      disabled={!documentFile || uploadingDocument}
                    >
                      {uploadingDocument ? 'Uploading...' : 'Upload Document'}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Alert>
          )}
          
          <h6 className="mt-4">Documents:</h6>
          {documents.aadharCard || documents.panCard || documents.incomeProof ? (
            <Row>
              {documents.aadharCard && (
                <Col md={4} className="mb-3">
                  <Card>
                    <Card.Body>
                      <h6>Aadhar Card</h6>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleViewDocument('aadharCard', documents.aadharCard)}
                        className="w-100"
                      >
                        View Document
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              )}
              
              {documents.panCard && (
                <Col md={4} className="mb-3">
                  <Card>
                    <Card.Body>
                      <h6>PAN Card</h6>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleViewDocument('panCard', documents.panCard)}
                        className="w-100"
                      >
                        View Document
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              )}
              
              {documents.incomeProof && (
                <Col md={4} className="mb-3">
                  <Card>
                    <Card.Body>
                      <h6>Income Proof</h6>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleViewDocument('incomeProof', documents.incomeProof)}
                        className="w-100"
                      >
                        View Document
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          ) : (
            <p>No documents available for review.</p>
          )}

          <Form.Group className="mt-3 mb-3">
            <Form.Label>Verification Notes:</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Add notes about this verification (optional)"
            />
          </Form.Group>

          <div className="d-flex justify-content-between mt-4">
            <Button 
              variant="secondary" 
              onClick={() => {
                setSelectedUser(null);
                setVerificationNotes('');
              }}
            >
              Back to List
            </Button>
            <div>
              <Button 
                variant="danger" 
                onClick={() => handleVerification('rejected')}
                className="me-2"
              >
                Reject Verification
              </Button>
              <Button 
                variant="success" 
                onClick={() => handleVerification('verified')}
              >
                Approve Verification
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <Button variant="outline-primary" size="sm" onClick={fetchAllUsers}>
                Refresh Data
              </Button>
              <span className="ms-2">Found {filteredUsers.length} users</span>
            </div>

            <Tabs
              activeKey={activeTab}
              onSelect={handleTabChange}
              className="mb-3"
            >
              <Tab eventKey="pending" title="Pending Verification" />
              <Tab eventKey="verified" title="Verified Users" />
              <Tab eventKey="all" title="All Users" />
            </Tabs>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center">
              <p>{activeTab === 'verified' ? 'No verified users found.' : 'No users pending verification.'}</p>
            </div>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Loan Applications</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id} className={user.hasPendingLoans ? 'table-warning' : ''}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={
                        user.verificationStatus === 'pending' ? 'warning' : 
                        user.verificationStatus === 'verified' ? 'success' : 
                        user.verificationStatus === 'not_submitted' ? 'secondary' : 'danger'
                      }>
                        {user.verificationStatus === 'not_submitted' ? 'Not Submitted' : user.verificationStatus}
                      </Badge>
                    </td>
                    <td>
                      {user.loanCount} 
                      {user.pendingLoanCount > 0 && (
                        <Badge bg="warning" className="ms-2">
                          {user.pendingLoanCount} pending
                        </Badge>
                      )}
                    </td>
                    <td>
                      <Button 
                        variant={user.hasPendingLoans ? "warning" : "primary"}
                        size="sm" 
                        onClick={() => handleViewDocuments(user._id)}
                        className="me-2"
                      >
                        {user.verificationStatus === 'verified' ? 'View Details' : 'Review Documents'}
                        {user.hasPendingLoans && ' (Urgent)'}
                      </Button>
                      
                      {user.verificationStatus !== 'verified' && user.hasPendingLoans && (
                        <Button 
                          variant="success"
                          size="sm" 
                          onClick={() => handleQuickVerify(user._id)}
                          title="Quickly verify this user without reviewing documents"
                        >
                          Quick Verify
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}

      {/* Document Viewer Modal */}
      <Modal 
        show={showDocumentModal} 
        onHide={() => setShowDocumentModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {currentDocument?.type === 'aadharCard' && 'Aadhar Card'}
            {currentDocument?.type === 'panCard' && 'PAN Card'}
            {currentDocument?.type === 'incomeProof' && 'Income Proof'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {currentDocument && (
            <div className="document-preview">
              <p className="mb-3">Filename: {currentDocument.filename}</p>
              <div className="border p-3">
                <p className="text-muted">Document preview would appear here in a real application</p>
                <p>This is a placeholder for document: {currentDocument.filename}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDocumentModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserVerificationPanel; 