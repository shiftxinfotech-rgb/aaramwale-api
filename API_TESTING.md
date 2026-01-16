# 🧪 API Testing Guide

Complete guide for testing all AaramWale API endpoints.

## Prerequisites

1. Server running on `http://localhost:3000`
2. Database configured and running
3. Postman or any API testing tool (or use curl)

## Step-by-Step Testing Flow

### 1️⃣ Register First Admin

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@aaramwale.com",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "name": "Super Admin",
  "email": "admin@aaramwale.com",
  "role": "ADMIN",
  "outletId": null,
  "isActive": true,
  "createdAt": "2026-01-13T..."
}
```

### 2️⃣ Login as Admin

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aaramwale.com",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@aaramwale.com",
    "name": "Super Admin",
    "role": "ADMIN",
    "outletId": null
  }
}
```

**⚠️ Important:** Save the `accessToken` - you'll need it for all subsequent admin requests!

### 3️⃣ Create an Outlet (Admin)

```bash
curl -X POST http://localhost:3000/outlets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Downtown Branch",
    "address": "123 Main Street, Floor 2",
    "city": "Mumbai",
    "phone": "+91-9876543210"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "name": "Downtown Branch",
  "address": "123 Main Street, Floor 2",
  "city": "Mumbai",
  "phone": "+91-9876543210",
  "isActive": true,
  "createdAt": "2026-01-13T..."
}
```

### 4️⃣ Create Chairs for the Outlet (Admin)

```bash
# Chair 1
curl -X POST http://localhost:3000/chairs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "outletId": 1,
    "chairNumber": "Chair-1",
    "rentPerToken": 100.00
  }'

# Chair 2
curl -X POST http://localhost:3000/chairs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "outletId": 1,
    "chairNumber": "Chair-2",
    "rentPerToken": 150.00
  }'
```

### 5️⃣ Create an Employee (Admin)

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "John Employee",
    "email": "john@aaramwale.com",
    "password": "employee123",
    "role": "EMPLOYEE",
    "outletId": 1
  }'
```

### 6️⃣ Login as Employee

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@aaramwale.com",
    "password": "employee123"
  }'
```

**⚠️ Save the employee token!**

### 7️⃣ View Available Chairs (Employee)

```bash
curl -X GET http://localhost:3000/chairs/outlet/1 \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN"
```

### 8️⃣ Generate Token for Customer (Employee)

```bash
curl -X POST http://localhost:3000/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN" \
  -d '{
    "chairId": 1,
    "customerName": "Rahul Kumar"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "outletId": 1,
  "chairId": 1,
  "userId": 2,
  "tokenNumber": "20260113-1-1-1",
  "customerName": "Rahul Kumar",
  "amount": "100.00",
  "status": "ACTIVE",
  "startTime": "2026-01-13T...",
  "createdAt": "2026-01-13T..."
}
```

### 9️⃣ View Employee's Tokens

```bash
curl -X GET http://localhost:3000/tokens/my-tokens \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN"
```

### 🔟 Get Today's Statistics

```bash
curl -X GET http://localhost:3000/tokens/stats/today \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN"
```

**Expected Response:**
```json
{
  "totalTokens": 5,
  "activeTokens": 3,
  "completedTokens": 2,
  "totalRevenue": 500,
  "date": "2026-01-13"
}
```

## Admin Operations

### View All Tokens (Admin only)

```bash
curl -X GET http://localhost:3000/tokens \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### View Tokens by Outlet (Admin only)

```bash
curl -X GET http://localhost:3000/tokens/outlet/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### View Tokens by Date Range (Admin only)

```bash
curl -X GET "http://localhost:3000/tokens/date-range?startDate=2026-01-01&endDate=2026-01-31&outletId=1" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Update Token Status (Admin only)

```bash
curl -X PATCH http://localhost:3000/tokens/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "COMPLETED"
  }'
```

### Delete Token (Admin only)

```bash
curl -X DELETE http://localhost:3000/tokens/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### View All Users (Admin only)

```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Update User (Admin only)

```bash
curl -X PATCH http://localhost:3000/users/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "isActive": false
  }'
```

### Delete User (Admin only)

```bash
curl -X DELETE http://localhost:3000/users/2 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Testing Permissions

### ❌ Employee Cannot Edit Tokens

```bash
curl -X PATCH http://localhost:3000/tokens/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN" \
  -d '{
    "status": "COMPLETED"
  }'
```

**Expected Response:** `403 Forbidden`

### ❌ Employee Cannot Create Users

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "role": "EMPLOYEE"
  }'
```

**Expected Response:** `403 Forbidden`

### ❌ Unauthenticated Request

```bash
curl -X GET http://localhost:3000/tokens
```

**Expected Response:** `401 Unauthorized`

## Common Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You do not have permission to access this resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Token with ID 999 not found",
  "error": "Not Found"
}
```

## Testing with Postman

1. Import the `postman-collection.json` file in Postman
2. Set the environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `adminToken`: (after admin login)
   - `employeeToken`: (after employee login)
3. Run the requests in order

## Swagger UI Testing

Visit `http://localhost:3000/api` to test the API using the interactive Swagger interface.

1. Click "Authorize" button
2. Enter your JWT token: `Bearer YOUR_TOKEN`
3. Click "Authorize"
4. Test any endpoint

## Database Verification

After testing, verify data in PostgreSQL:

```sql
-- View all tables
\dt

-- View users
SELECT id, name, email, role, "outletId", "isActive" FROM users;

-- View outlets
SELECT * FROM outlets;

-- View chairs
SELECT * FROM chairs;

-- View tokens
SELECT id, "tokenNumber", "customerName", amount, status, "createdAt" FROM tokens;

-- Get today's revenue
SELECT 
  SUM(amount) as total_revenue,
  COUNT(*) as total_tokens
FROM tokens 
WHERE DATE("createdAt") = CURRENT_DATE;
```

## Load Testing (Optional)

Test with multiple concurrent token generations:

```bash
# Install Apache Bench (if not already installed)
brew install httpd  # macOS

# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 -T "application/json" \
   -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN" \
   -p token.json \
   http://localhost:3000/tokens
```

Where `token.json` contains:
```json
{
  "chairId": 1,
  "customerName": "Test Customer"
}
```

---

✅ **All tests passing = API is working correctly!**
