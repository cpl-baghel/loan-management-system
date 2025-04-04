import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import { getAdminStats } from '../../services/adminService';

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching admin stats...');
      const data = await getAdminStats();
      console.log('Admin stats received:', data);
      setStats(data);
    } catch (err) {
      console.error('Admin stats error:', err);
      setError(`Failed to fetch admin statistics: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center">Loading statistics...</p>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!stats) return null;

  return (
    <Row>
      <Col md={3}>
        <Card className="mb-4">
          <Card.Body>
            <h6 className="text-muted">Pending Verifications</h6>
            <h3>{stats.verificationCounts?.pending || 0}</h3>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="mb-4">
          <Card.Body>
            <h6 className="text-muted">Total Users</h6>
            <h3>{(stats.verificationCounts?.verified || 0) + 
                (stats.verificationCounts?.pending || 0) + 
                (stats.verificationCounts?.rejected || 0) + 
                (stats.verificationCounts?.notSubmitted || 0)}</h3>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="mb-4">
          <Card.Body>
            <h6 className="text-muted">Active Loans</h6>
            <h3>{stats.loanCounts?.approved || 0}</h3>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="mb-4">
          <Card.Body>
            <h6 className="text-muted">Pending Loans</h6>
            <h3>{stats.loanCounts?.pending || 0}</h3>
            <small className="text-muted">₹{stats.loanAmounts?.pending || 0}</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default AdminStats; 