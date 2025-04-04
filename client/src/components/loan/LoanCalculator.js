import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Table } from 'react-bootstrap';

// Internal interest rate of 96% per annum (not shown to customers)
const FIXED_INTEREST_RATE = 96;

// Displayed interest rate to customers
const DISPLAYED_INTEREST_RATE = "competitive";

const LoanCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [loanTerm, setLoanTerm] = useState(12);
  const [emiAmount, setEmiAmount] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);

  // Calculate EMI when loan amount or term changes
  useEffect(() => {
    calculateEmi();
  }, [loanAmount, loanTerm]);

  // Helper to format currency in Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate the EMI amount
  const calculateEmi = () => {
    const principal = parseFloat(loanAmount);
    const rate = FIXED_INTEREST_RATE / 100 / 12; // Monthly interest rate
    const time = parseInt(loanTerm); // Time in months

    if (principal > 0 && time > 0) {
      // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
      const emi = (principal * rate * Math.pow(1 + rate, time)) / (Math.pow(1 + rate, time) - 1);
      const totalAmount = emi * time;
      const interestAmount = totalAmount - principal;

      setEmiAmount(emi);
      setTotalPayment(totalAmount);
      setTotalInterest(interestAmount);

      // Generate amortization schedule
      generateAmortizationSchedule(principal, rate, time, emi);
    } else {
      setEmiAmount(0);
      setTotalPayment(0);
      setTotalInterest(0);
      setAmortizationSchedule([]);
    }
  };

  // Generate monthly payment schedule
  const generateAmortizationSchedule = (principal, rate, time, emi) => {
    let balance = principal;
    const schedule = [];

    for (let i = 1; i <= time; i++) {
      const interest = balance * rate;
      const principalPaid = emi - interest;
      balance -= principalPaid;

      schedule.push({
        month: i,
        emi: emi,
        principal: principalPaid,
        interest: interest,
        balance: balance > 0 ? balance : 0
      });
    }

    setAmortizationSchedule(schedule);
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>EMI Calculator</h4>
        <p className="text-muted mb-0">Interest Rate: {DISPLAYED_INTEREST_RATE}</p>
      </Card.Header>
      <Card.Body>
        <Form>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Loan Amount (₹)</Form.Label>
                <Form.Control
                  type="number"
                  min="1000"
                  step="1000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Loan Term (Months)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="24"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>

        <div className="bg-light p-3 rounded mb-4">
          <Row>
            <Col md={4} className="text-center border-end">
              <p className="text-muted mb-1">Monthly EMI</p>
              <h3 className="mb-0">{formatCurrency(emiAmount)}</h3>
            </Col>
            <Col md={4} className="text-center border-end">
              <p className="text-muted mb-1">Total Interest</p>
              <h3 className="mb-0">{formatCurrency(totalInterest)}</h3>
            </Col>
            <Col md={4} className="text-center">
              <p className="text-muted mb-1">Total Payment</p>
              <h3 className="mb-0">{formatCurrency(totalPayment)}</h3>
            </Col>
          </Row>
        </div>

        {amortizationSchedule.length > 0 && (
          <div className="table-responsive">
            <h5 className="mb-3">Repayment Schedule</h5>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>EMI Payment</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {amortizationSchedule.map((item) => (
                  <tr key={item.month}>
                    <td>{item.month}</td>
                    <td>{formatCurrency(item.emi)}</td>
                    <td>{formatCurrency(item.principal)}</td>
                    <td>{formatCurrency(item.interest)}</td>
                    <td>{formatCurrency(item.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default LoanCalculator; 