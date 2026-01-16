# AaramWale API - Massage Chair Rental System

A comprehensive backend system built with NestJS and PostgreSQL for managing a multi-outlet massage chair rental business with token-based session tracking.

## 🏢 Business Overview

**AaramWale** is a massage chair rental service with multiple outlets. Each outlet has multiple employees and massage chairs. Customers rent chairs for massage sessions, and each session is tracked through a token system.

### Key Features

- **Multi-outlet Management**: Manage multiple business locations
- **Employee Management**: Create and manage employees per outlet
- **Chair Management**: Track chairs across all outlets
- **Token System**: Generate and track customer massage sessions
- **Role-Based Access Control**: Admin and Employee roles with different permissions
- **Real-time Statistics**: Track daily revenue and usage

## 📋 User Roles & Permissions

### 👨‍💼 Admin
- ✅ Create, edit, and delete outlets
- ✅ Create, edit, and delete employees
- ✅ Manage all chairs
- ✅ View all token data across all outlets
- ✅ Edit or delete tokens
- ✅ Access full system analytics

### 👤 Employee
- ✅ Log in to their outlet
- ✅ Generate tokens for customers
- ✅ Assign chair numbers
- ✅ View their own generated tokens
- ✅ View outlet statistics
- ❌ Cannot edit or delete tokens
- ❌ Cannot modify outlet or employee data

## 🛠️ Technology Stack

- **Framework**: NestJS 11.x
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger/OpenAPI
- **Password Hashing**: bcrypt

## 📁 Project Structure

```
src/
├── auth/               # Authentication & authorization
│   ├── guards/         # JWT and roles guards
│   ├── decorators/     # Custom decorators (Roles, GetUser)
│   └── dto/            # Login, register DTOs
├── users/              # User management (Admin, Employee)
├── outlets/            # Outlet management
├── chairs/             # Chair management
├── tokens/             # Token generation & tracking
└── main.ts            # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd aaramwale-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup PostgreSQL Database**
```sql
CREATE DATABASE aaramwale_db;
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=aaramwale_db

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h

PORT=3000
```

5. **Run the application**
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## 📚 API Documentation

Once the server is running, access the Swagger API documentation at:
```
http://localhost:3000/api
```

## 🔐 Authentication Flow

### 1. Register/Create Users

**Admin Registration** (First user - create manually):
```bash
POST /auth/register
{
  "name": "Admin User",
  "email": "admin@aaramwale.com",
  "password": "admin123",
  "role": "ADMIN"
}
```

**Employee Registration** (by Admin):
```bash
POST /auth/register
{
  "name": "Employee Name",
  "email": "employee@aaramwale.com",
  "password": "employee123",
  "role": "EMPLOYEE",
  "outletId": 1
}
```

### 2. Login

```bash
POST /auth/login
{
  "email": "admin@aaramwale.com",
  "password": "admin123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@aaramwale.com",
    "name": "Admin User",
    "role": "ADMIN",
    "outletId": null
  }
}
```

### 3. Use Token in Requests

Add the JWT token to the Authorization header:
```
Authorization: Bearer <your-token>
```

## 🎯 API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token

### Outlets (Admin)
- `POST /outlets` - Create outlet
- `GET /outlets` - Get all outlets
- `GET /outlets/:id` - Get outlet by ID
- `PATCH /outlets/:id` - Update outlet
- `DELETE /outlets/:id` - Delete outlet

### Users (Admin only)
- `POST /users` - Create user (Admin/Employee)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `GET /users/outlet/:outletId` - Get users by outlet
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Chairs (Admin: full access, Employee: read only)
- `POST /chairs` - Create chair (Admin)
- `GET /chairs` - Get all chairs
- `GET /chairs/:id` - Get chair by ID
- `GET /chairs/outlet/:outletId` - Get chairs by outlet
- `PATCH /chairs/:id` - Update chair (Admin)
- `DELETE /chairs/:id` - Delete chair (Admin)

### Tokens (Employee: create & view own, Admin: full access)
- `POST /tokens` - Generate new token (Employee)
- `GET /tokens` - Get all tokens
- `GET /tokens/my-tokens` - Get employee's own tokens
- `GET /tokens/:id` - Get token by ID
- `GET /tokens/stats/today` - Get today's statistics
- `GET /tokens/outlet/:outletId` - Get tokens by outlet (Admin)
- `GET /tokens/date-range` - Get tokens by date range (Admin)
- `PATCH /tokens/:id` - Update token (Admin)
- `DELETE /tokens/:id` - Delete token (Admin)

## 💡 Usage Examples

### 1. Complete Setup Flow

```bash
# 1. Create Admin user
POST /auth/register
{
  "name": "Super Admin",
  "email": "admin@aaramwale.com",
  "password": "admin123",
  "role": "ADMIN"
}

# 2. Login as Admin
POST /auth/login
{
  "email": "admin@aaramwale.com",
  "password": "admin123"
}

# 3. Create an Outlet
POST /outlets
{
  "name": "Downtown Branch",
  "address": "123 Main Street",
  "city": "Mumbai",
  "phone": "+91-9876543210"
}

# 4. Create Chairs for the Outlet
POST /chairs
{
  "outletId": 1,
  "chairNumber": "Chair-1",
  "rentPerToken": 100.00
}

# 5. Create Employee for the Outlet
POST /users
{
  "name": "John Employee",
  "email": "john@aaramwale.com",
  "password": "john123",
  "role": "EMPLOYEE",
  "outletId": 1
}
```

### 2. Employee Workflow

```bash
# 1. Employee logs in
POST /auth/login
{
  "email": "john@aaramwale.com",
  "password": "john123"
}

# 2. View available chairs in their outlet
GET /chairs/outlet/1

# 3. Generate token for customer
POST /tokens
{
  "chairId": 1,
  "customerName": "Rahul Kumar"
}

# 4. View their generated tokens
GET /tokens/my-tokens

# 5. Check today's statistics
GET /tokens/stats/today
```

### 3. Admin Analytics

```bash
# Get all tokens across all outlets
GET /tokens

# Get tokens for specific outlet
GET /tokens/outlet/1

# Get tokens by date range
GET /tokens/date-range?startDate=2026-01-01&endDate=2026-01-31&outletId=1

# Get today's stats
GET /tokens/stats/today
```

## 🗃️ Database Schema

### Users
- Stores admin and employee accounts
- Linked to outlets for employees
- Password hashed with bcrypt

### Outlets
- Multiple business locations
- Has many users (employees)
- Has many chairs
- Has many tokens

### Chairs
- Belongs to one outlet
- Has rental price per token
- Tracks active/inactive status

### Tokens
- Represents one customer session
- Links: outlet, chair, employee (user)
- Tracks status: ACTIVE, COMPLETED, CANCELLED
- Records start/end time and revenue

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Route guards for protected endpoints
- Input validation with DTOs
- SQL injection protection via TypeORM

## 📊 Business Logic

### Token Generation
1. Employee selects a chair
2. System validates chair availability
3. Generates unique token number: `YYYYMMDD-OUTLET-CHAIR-SEQ`
4. Records start time, chair, employee, and amount
5. Token status set to ACTIVE

### Token Tracking
- Each token tracks: outlet, chair, employee, time, amount
- Employees can only view their own tokens
- Admins can view, edit, and delete all tokens
- Daily statistics calculated from token data

## 🚀 Deployment

### Production Checklist

1. Set `synchronize: false` in TypeORM config
2. Run database migrations
3. Use strong JWT secret
4. Enable HTTPS
5. Set up proper CORS origins
6. Configure environment variables
7. Set up database backups
8. Enable logging and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED License.

## 📞 Support

For support, email support@aaramwale.com or create an issue in the repository.

---

Built with ❤️ using NestJS
