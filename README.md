# Loan Management System

A simple and efficient way to manage loan applications. This full-stack application allows customers to apply for loans and administrators to review, approve, or reject them.

## Features

- User authentication (login and registration)
- Customer features:
  - Apply for a loan
  - View loan application status
  - Track loan details and history
- Admin features:
  - Review pending loan applications
  - Approve or reject loans with feedback
  - View all loans and their status
  - Manage users (promote to admin)

## Tech Stack

- **Frontend**: React, React Router, Bootstrap, Axios
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JSON Web Tokens (JWT)

## Setup Instructions

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd loan-management-system
```

2. Set up the backend:
```
cd server
npm install
```

3. Configure environment variables:
   - Create a `.env` file in the `server` directory with:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. Set up the frontend:
```
cd ../client
npm install
```

5. Start the application:
   - Backend:
   ```
   cd server
   npm start
   ```
   - Frontend:
   ```
   cd client
   npm start
   ```

6. Access the application at `http://localhost:3000`

## Initial Admin Setup

To create the first admin user:
1. Register a regular user through the application
2. Access your MongoDB database and update the user's role:
```javascript
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

## Screenshots

[Insert screenshots here]

## License

This project is licensed under the MIT License. 