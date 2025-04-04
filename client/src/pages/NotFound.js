import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="text-center">
            <Card.Body>
              <h1 className="display-1">404</h1>
              <h2 className="mb-4">Page Not Found</h2>
              <p className="mb-4">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
              </p>
              <Button as={Link} to="/" variant="primary">
                Go to Home Page
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound; 