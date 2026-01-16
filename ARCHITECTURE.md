# AaramWale System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AARAMWALE API SYSTEM                     │
│                   (NestJS + PostgreSQL)                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐           ┌─────────────────┐
│  Admin Panel    │           │   Mobile App    │
│   (Frontend)    │           │   (Frontend)    │
└────────┬────────┘           └────────┬────────┘
         │                             │
         │   REST API (JWT Auth)       │
         │                             │
         └─────────────┬───────────────┘
                       │
         ┌─────────────▼────────────────┐
         │      NestJS Backend API      │
         │   (Port 3000)                │
         │   - Authentication           │
         │   - Authorization            │
         │   - Business Logic           │
         │   - Validation               │
         └─────────────┬────────────────┘
                       │
         ┌─────────────▼────────────────┐
         │    PostgreSQL Database       │
         │   - Users (Admin/Employee)   │
         │   - Outlets                  │
         │   - Chairs                   │
         │   - Tokens                   │
         └──────────────────────────────┘
```

## User Flow Diagram

```
┌──────────────┐
│   ADMIN      │
│   Login      │
└──────┬───────┘
       │
       ├───► Create Outlets
       │       │
       │       └───► Create Chairs
       │               │
       │               └───► Assign Chairs to Outlets
       │
       ├───► Create Employees
       │       │
       │       └───► Assign Employees to Outlets
       │
       ├───► View All Tokens
       │       │
       │       ├───► Filter by Outlet
       │       ├───► Filter by Date
       │       └───► View Revenue Stats
       │
       └───► Manage System
               ├───► Edit Tokens
               ├───► Delete Tokens
               └───► View Analytics


┌──────────────┐
│  EMPLOYEE    │
│   Login      │
└──────┬───────┘
       │
       ├───► View Outlet Chairs
       │       │
       │       └───► Check Availability
       │
       ├───► Generate Token
       │       │
       │       ├───► Select Chair
       │       ├───► Enter Customer Name
       │       └───► Create Token
       │
       ├───► View My Tokens
       │       │
       │       └───► Filter by Date
       │
       └───► View Today's Stats
               ├───► Total Tokens
               ├───► Active Tokens
               └───► Revenue
```

## Database Entity Relationships

```
┌──────────────────────┐
│       OUTLET         │
│──────────────────────│
│ PK  id               │◄────────┐
│     name             │         │
│     address          │         │ 1
│     city             │         │
│     phone            │         │
│     isActive         │         │
└──────────────────────┘         │
         △                       │
         │ 1                     │
         │                       │
         │ *                     │
┌────────┴─────────────┐         │
│       USER           │         │
│──────────────────────│         │
│ PK  id               │         │
│     name             │         │
│     email            │         │
│     password         │         │
│     role (enum)      │         │
│ FK  outletId         │─────────┘
│     isActive         │
└──────────────────────┘
         │
         │ 1
         │
         │ *
┌────────▼─────────────┐
│       TOKEN          │
│──────────────────────│
│ PK  id               │
│ FK  outletId         │────────┐
│ FK  chairId          │────┐   │
│ FK  userId           │    │   │
│     tokenNumber      │    │   │
│     customerName     │    │   │
│     amount           │    │   │
│     status           │    │   │
│     startTime        │    │   │
│     endTime          │    │   │
└──────────────────────┘    │   │
                            │   │
┌──────────────────────┐    │   │
│       CHAIR          │    │   │
│──────────────────────│    │   │
│ PK  id               │◄───┘   │
│ FK  outletId         │────────┘
│     chairNumber      │
│     rentPerToken     │
│     isActive         │
└──────────────────────┘
```

## API Architecture

```
┌─────────────────────────────────────────────┐
│             HTTP Requests                    │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│         NestJS Middleware Layer             │
│   - CORS                                    │
│   - Body Parser                             │
│   - Validation Pipe                         │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│         Authentication Layer                │
│   - JWT Strategy                            │
│   - Passport                                │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│         Authorization Layer                 │
│   - JWT Auth Guard                          │
│   - Roles Guard                             │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│            Controllers                       │
│   - Auth Controller                         │
│   - Users Controller                        │
│   - Outlets Controller                      │
│   - Chairs Controller                       │
│   - Tokens Controller                       │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│              Services                        │
│   - Auth Service                            │
│   - Users Service                           │
│   - Outlets Service                         │
│   - Chairs Service                          │
│   - Tokens Service                          │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│         TypeORM Repositories                │
│   - User Repository                         │
│   - Outlet Repository                       │
│   - Chair Repository                        │
│   - Token Repository                        │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│         PostgreSQL Database                 │
└─────────────────────────────────────────────┘
```

## Request Flow Example: Generate Token

```
1. Employee Mobile App
   │
   ├─► POST /tokens
   │   Headers: { Authorization: "Bearer <JWT>" }
   │   Body: { chairId: 1, customerName: "John" }
   │
   ▼
2. NestJS Server
   │
   ├─► Validation Pipe
   │   └─► Validates DTO structure
   │
   ├─► JWT Auth Guard
   │   └─► Verifies JWT token
   │   └─► Extracts user info (userId, role, outletId)
   │
   ├─► Roles Guard
   │   └─► Checks if role = EMPLOYEE
   │
   ├─► Tokens Controller
   │   └─► Calls TokensService.create()
   │
   ▼
3. Tokens Service
   │
   ├─► Get chair from database
   ├─► Validate chair belongs to employee's outlet
   ├─► Check chair is active
   ├─► Generate unique token number
   ├─► Calculate amount from chair price
   ├─► Create token record
   │
   ▼
4. Database
   │
   ├─► Insert token record
   ├─► Return created token
   │
   ▼
5. Response to Mobile App
   {
     "id": 1,
     "tokenNumber": "20260113-1-1-1",
     "customerName": "John",
     "amount": 100.00,
     "status": "ACTIVE"
   }
```

## Security Flow

```
┌─────────────────┐
│  User Login     │
└────────┬────────┘
         │
         ├─► Enter email & password
         │
         ▼
┌─────────────────────────────┐
│  Auth Service               │
├─────────────────────────────┤
│ 1. Find user by email       │
│ 2. Compare hashed password  │
│ 3. Check if user is active  │
│ 4. Generate JWT token       │
│    └─ Payload:              │
│       - userId              │
│       - email               │
│       - role                │
│       - outletId            │
└────────┬────────────────────┘
         │
         ├─► Return JWT token
         │
         ▼
┌─────────────────────────────┐
│  Client Stores Token        │
└────────┬────────────────────┘
         │
         ├─► All future requests include:
         │   Authorization: Bearer <token>
         │
         ▼
┌─────────────────────────────┐
│  Protected Endpoint         │
├─────────────────────────────┤
│ 1. JWT Guard validates token│
│ 2. Roles Guard checks role  │
│ 3. Process request          │
└─────────────────────────────┘
```

## Module Dependencies

```
                    AppModule
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    ConfigModule   TypeOrmModule   AuthModule
                                        │
        ┌───────────────┴───────────────┼───────────┐
        │               │               │           │
   UsersModule    OutletsModule   ChairsModule  TokensModule
        │               │               │           │
        └───────────────┴───────────────┴───────────┘
                        │
                   Shared Services
                   Shared Guards
                   Shared Decorators
```

## Deployment Architecture (Production)

```
┌─────────────────┐
│  Load Balancer  │
│   (nginx)       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────┐   ┌─────┐
│ PM2 │   │ PM2 │   (Multiple NestJS instances)
│ App │   │ App │
└──┬──┘   └──┬──┘
   │         │
   └────┬────┘
        │
        ▼
┌────────────────┐
│  PostgreSQL    │
│  (Primary)     │
└────────┬───────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────┐   ┌─────┐
│Repl │   │Repl │   (Read replicas)
│ica  │   │ica  │
└─────┘   └─────┘
```

---

## Color Legend for Future UI

- **Admin Actions**: 🔴 Red (High privilege)
- **Employee Actions**: 🟢 Green (Normal operations)
- **Active Status**: 🟢 Green
- **Completed Status**: 🔵 Blue
- **Cancelled Status**: ⚫ Gray
- **Revenue**: 💰 Gold
