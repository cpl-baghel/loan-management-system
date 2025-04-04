import React, { useContext } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  console.log('Current user in Header:', user);
  console.log('User role from localStorage:', localStorage.getItem('userRole'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Loan Management System</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {user ? (
              <>
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                {user.role === 'admin' && (
                  <Nav.Link as={Link} to="/admin">Admin Panel</Nav.Link>
                )}
                {user.verificationStatus === 'not_submitted' && (
                  <Nav.Link as={Link} to="/kyc-submission" className="text-warning">
                    Complete KYC <i className="fas fa-exclamation-circle"></i>
                  </Nav.Link>
                )}
                <Nav.Link as={Link} to="/apply-loan">Apply for Loan</Nav.Link>
                <Button variant="outline-light" onClick={handleLogout} className="ms-2">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 