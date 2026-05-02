# 🚀 Quick Reference - AaramWale API

## Start Server
```bash
npm run start:dev
```

## Access Points
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api

## Quick Setup
```bash
# 1. Configure database in .env
# 2. Create database: CREATE DATABASE aaramwale_db;
# 3. Start server: npm run start:dev
```

## First-Time Setup Flow

### 1. Register Admin
```bash
POST /auth/register
{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "ADMIN"
}
```

### 2. Login
```bash
POST /auth/login
{
  "email": "aaramwala.rajkot@gmail.com",
  "password": "password123"
}
# Save the accessToken!
```

### 3. Create Outlet
```bash
POST /outlets
Authorization: Bearer YOUR_TOKEN
{
  "name": "Branch 1",
  "address": "Street Address",
  "city": "Mumbai",
  "phone": "+91-1234567890"
}
```

### 4. Create Chair
```bash
POST /chairs
Authorization: Bearer YOUR_TOKEN
{
  "outletId": 1,
  "chairNumber": "Chair-1",
  "rentPerToken": 100.00
}
```

### 5. Create Employee
```bash
POST /users
Authorization: Bearer YOUR_TOKEN
{
  "name": "Employee Name",
  "email": "employee@example.com",
  "password": "emp123",
  "role": "EMPLOYEE",
  "outletId": 1
}
```

### 6. Employee Generates Token
```bash
POST /tokens
Authorization: Bearer EMPLOYEE_TOKEN
{
  "chairId": 1,
  "amount": 50,
  "status": "ACTIVE"
}
```

## Common Commands

### Admin Operations
```bash
# View all tokens
GET /tokens
Authorization: Bearer ADMIN_TOKEN

# View outlet stats
GET /tokens/stats/today
Authorization: Bearer ADMIN_TOKEN

# Update token status
PATCH /tokens/1
Authorization: Bearer ADMIN_TOKEN
{"status": "COMPLETED"}

# View all users
GET /users
Authorization: Bearer ADMIN_TOKEN
```

### Employee Operations
```bash
# View my tokens
GET /tokens/my-tokens
Authorization: Bearer EMPLOYEE_TOKEN

# View outlet chairs
GET /chairs/outlet/1
Authorization: Bearer EMPLOYEE_TOKEN

# Today's stats
GET /tokens/stats/today
Authorization: Bearer EMPLOYEE_TOKEN
```

## Environment Variables (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=aaramwale_db

JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

PORT=3000
```

## Database Schema Quick View

**users**: id, name, email, password, role, outletId
**outlets**: id, name, address, city, phone
**chairs**: id, outletId, chairNumber, rentPerToken
**tokens**: id, outletId, chairId, userId, amount, status, createdAt, updatedAt

## Token Number Format
```
YYYYMMDD-OUTLET-CHAIR-SEQ
Example: 20260113-1-1-1
```

## User Roles

**ADMIN**:
- Full access to all endpoints
- Can create/edit/delete anything
- Views all outlet data

**EMPLOYEE**:
- Can generate tokens
- View only their outlet data
- Cannot edit or delete tokens
- Cannot manage users/outlets

## Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (no token or invalid)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found

## Testing

### Using Swagger
1. Visit: http://localhost:3000/api
2. Click "Authorize"
3. Enter: `Bearer YOUR_TOKEN`
4. Test endpoints

### Using Postman
1. Import: `postman-collection.json`
2. Set variables: `adminToken`, `employeeToken`
3. Run requests

### Using curl
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## Quick Troubleshooting

**DB Connection Failed**
- Check PostgreSQL is running
- Verify .env credentials
- Ensure database exists

**401 Unauthorized**
- Check token in Authorization header
- Format: `Bearer <token>`
- Token may have expired (24h)

**403 Forbidden**
- User doesn't have permission
- Check role (ADMIN vs EMPLOYEE)

**404 Not Found**
- Verify resource ID exists
- Check endpoint path

## Useful SQL Queries

```sql
-- View all data
SELECT * FROM users;
SELECT * FROM outlets;
SELECT * FROM chairs;
SELECT * FROM tokens;

-- Today's revenue
SELECT SUM(amount) FROM tokens 
WHERE DATE("createdAt") = CURRENT_DATE;

-- Active tokens
SELECT COUNT(*) FROM tokens WHERE status = 'ACTIVE';

-- Tokens by employee
SELECT u.name, COUNT(*) as token_count
FROM tokens t
JOIN users u ON t."userId" = u.id
GROUP BY u.name;
```

## Documentation Files

📖 **SETUP_GUIDE.md** - Detailed setup
📖 **API_TESTING.md** - Testing guide
📖 **PROJECT_SUMMARY.md** - Overview
📋 **postman-collection.json** - Postman tests

---

**Need Help?** Check the documentation files or Swagger UI at `/api`
