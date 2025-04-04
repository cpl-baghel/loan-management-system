import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './dashboard.css';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const DashboardCharts = ({ loansData, usersCount }) => {
  // Calculate summary data
  const calculateSummary = () => {
    const pending = loansData.filter(loan => loan.status === 'pending');
    const approved = loansData.filter(loan => loan.status === 'approved');
    const rejected = loansData.filter(loan => loan.status === 'rejected');
    const paid = loansData.filter(loan => loan.status === 'paid');

    const pendingAmount = pending.reduce((sum, loan) => sum + loan.amount, 0);
    const approvedAmount = approved.reduce((sum, loan) => sum + loan.amount, 0);
    const rejectedAmount = rejected.reduce((sum, loan) => sum + loan.amount, 0);
    const paidAmount = paid.reduce((sum, loan) => sum + loan.amount, 0);

    // Calculate upcoming EMIs (total of all monthly payments for approved loans)
    const upcomingEmi = approved.reduce((sum, loan) => {
      const monthlyRate = loan.interestRate / 100 / 12;
      const payment = (loan.amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -loan.term));
      return sum + payment;
    }, 0);

    return {
      counts: {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        paid: paid.length,
        total: loansData.length,
        users: usersCount
      },
      amounts: {
        pending: pendingAmount,
        approved: approvedAmount,
        rejected: rejectedAmount,
        paid: paidAmount,
        total: pendingAmount + approvedAmount + rejectedAmount + paidAmount,
        upcomingEmi: upcomingEmi
      }
    };
  };

  const summary = calculateSummary();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Loan Status Distribution Pie Chart
  const loanStatusData = {
    labels: ['Pending', 'Approved', 'Rejected', 'Paid'],
    datasets: [
      {
        data: [
          summary.counts.pending,
          summary.counts.approved,
          summary.counts.rejected,
          summary.counts.paid
        ],
        backgroundColor: [
          '#ffc107', // warning - yellow for pending
          '#28a745', // success - green for approved
          '#dc3545', // danger - red for rejected
          '#0d6efd', // primary - blue for paid
        ],
        borderWidth: 1,
      },
    ],
  };

  // Loan Amount Distribution Pie Chart
  const loanAmountData = {
    labels: ['Pending', 'Approved', 'Rejected', 'Paid'],
    datasets: [
      {
        data: [
          summary.amounts.pending,
          summary.amounts.approved,
          summary.amounts.rejected,
          summary.amounts.paid
        ],
        backgroundColor: [
          '#ffc107', // warning - yellow for pending
          '#28a745', // success - green for approved
          '#dc3545', // danger - red for rejected
          '#0d6efd', // primary - blue for paid
        ],
        borderWidth: 1,
      },
    ],
  };

  // Monthly loan data (simulated for the chart)
  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Last 6 months
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      labels.push(months[monthIndex]);
    }

    // Generate random data for demonstration
    const approvedData = Array.from({length: 6}, () => Math.floor(Math.random() * 5));
    const pendingData = Array.from({length: 6}, () => Math.floor(Math.random() * 3));
    
    return {
      labels,
      approvedData,
      pendingData
    };
  };

  const monthlyData = generateMonthlyData();

  const monthlyLoanData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Approved Loans',
        data: monthlyData.approvedData,
        backgroundColor: '#28a745',
      },
      {
        label: 'Pending Loans',
        data: monthlyData.pendingData,
        backgroundColor: '#ffc107',
      }
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Loan Activity',
      },
    },
  };

  return (
    <>
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100 dashboard-stat-card">
            <Card.Body className="text-center">
              <h6 className="text-muted">Total Loans</h6>
              <h3>{summary.counts.total}</h3>
              <p className="text-success mb-0">
                {formatCurrency(summary.amounts.total)}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 dashboard-stat-card">
            <Card.Body className="text-center">
              <h6 className="text-muted">Disbursed Loans</h6>
              <h3>{summary.counts.approved}</h3>
              <p className="text-success mb-0">
                {formatCurrency(summary.amounts.approved)}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 dashboard-stat-card">
            <Card.Body className="text-center">
              <h6 className="text-muted">Pending Applications</h6>
              <h3>{summary.counts.pending}</h3>
              <p className="text-warning mb-0">
                {formatCurrency(summary.amounts.pending)}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 dashboard-stat-card">
            <Card.Body className="text-center">
              <h6 className="text-muted">Upcoming EMI (Monthly)</h6>
              <h3>{formatCurrency(summary.amounts.upcomingEmi)}</h3>
              <p className="text-primary mb-0">
                Active Users: {summary.counts.users}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Loan Status Distribution</h5>
            </Card.Header>
            <Card.Body>
              <Pie data={loanStatusData} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Loan Amount Distribution</h5>
            </Card.Header>
            <Card.Body>
              <Pie data={loanAmountData} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Monthly Loan Activity</h5>
            </Card.Header>
            <Card.Body>
              <Bar options={barOptions} data={monthlyLoanData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DashboardCharts; 