import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Container>
      <Row className="my-4">
        <Col>
          <div className="text-center">
            <h1>Welcome to Loan Management System</h1>
            <p className="lead">
              A simple and efficient way to manage loan applications
            </p>
          </div>
        </Col>
      </Row>

      <Row className="my-5">
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title>Apply for Loan</Card.Title>
              <Card.Text>
                Need financial assistance? Apply for a loan with our simple application process. Get quick decisions and competitive rates.
              </Card.Text>
              <div className="mt-auto">
                <Button as={Link} to="/apply-loan" variant="primary">Apply Now</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title>Track Applications</Card.Title>
              <Card.Text>
                Already applied? Track the status of your loan applications in real-time through your personal dashboard.
              </Card.Text>
              <div className="mt-auto">
                <Button as={Link} to="/dashboard" variant="primary">View Dashboard</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title>Admin Controls</Card.Title>
              <Card.Text>
                For administrators: Manage loan applications, approve or reject loans, and handle user accounts.
              </Card.Text>
              <div className="mt-auto">
                <Button as={Link} to="/admin" variant="primary">Admin Panel</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="my-5">
        <Col>
          <Card>
            <Card.Body>
              <h3>How It Works</h3>
              <ol>
                <li>Create an account or login to your existing account</li>
                <li>Fill out a loan application with your details</li>
                <li>Submit your application for review</li>
                <li>Track the status of your application in your dashboard</li>
                <li>Receive notifications about application updates</li>
              </ol>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home; 