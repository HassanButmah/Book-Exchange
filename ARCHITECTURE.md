# 🏗️ HU Book Exchange - Architecture & System Overview

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                   (http://localhost:3000)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  HTML + CSS + Vanilla JavaScript                         │   │
│  │  - Landing Page                                          │   │
│  │  - Authentication (Register, Login, Verify)             │   │
│  │  - Book Marketplace (Browse, Search, Filter)            │   │
│  │  - Add Book Form                                         │   │
│  │  - My Books Dashboard                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓↑                                       │
│                   JSON via HTTP/CORS                             │
│                          ↓↑                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ↓             ↓
        ┌─────────────────┐  ┌─────────────────┐
        │  HTTP Server    │  │  Static Files   │
        │  :5000 (Node)   │  │  (index.html etc)
        └────────┬────────┘  └─────────────────┘
                 │
        ┌────────┴────────────────────────┐
        │                                  │
        ↓                                  ↓
    ┌─────────────────┐        ┌──────────────────┐
    │  Express App    │        │   PostgreSQL     │
    │                 │        │   Database       │
    │ ┌─────────────┐ │        │                  │
    │ │ Routes      │ │        │ ┌──────────────┐ │
    │ ├─────────────┤ │        │ │ users        │ │
    │ │ /auth       │ │        │ ├──────────────┤ │
    │ │ /books      │ │        │ │ verification │ │
    │ ├─────────────┤ │        │ │   _codes     │ │
    │ │             │ │        │ ├──────────────┤ │
    │ │ Middleware  │ │        │ │ books        │ │
    │ ├─────────────┤ │        │ └──────────────┘ │
    │ │ JWT Auth    │ │        │                  │
    │ ├─────────────┤ │        └──────────────────┘
    │ │             │ │                 ↑
    │ │ Controllers │ │                 │
    │ ├─────────────┤ │        SQL Queries
    │ │ authCtrl    │ │                 │
    │ │ bookCtrl    │ │                 │
    │ └─────────────┘ │                 │
    │                 │                 │
    └─────────────────┴─────────────────┘
```

---

## 🔄 Request/Response Flow

### 1. Registration Flow
```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Enter email, name, password
       ↓
┌──────────────────────┐
│ Register Page        │
│ Validate email       │
└──────┬───────────────┘
       │ POST /api/auth/register
       ↓
┌──────────────────────┐
│ Backend              │
│ - Validate @students │
│ - Hash password      │
│ - Generate OTP       │
│ - Save to DB         │
└──────┬───────────────┘
       │ Return userId
       ↓
┌──────────────────────┐
│ Show Verification    │
│ Modal                │
└──────┬───────────────┘
       │ Enter 6-digit code
       ↓
┌──────────────────────┐
│ Backend              │
│ - Verify code       │
│ - Mark user verified│
│ - Delete code       │
└──────┬───────────────┘
       │ ✓ Success
       ↓
┌──────────────────────┐
│ Redirect to Login    │
└──────────────────────┘
```

### 2. Login Flow
```
┌──────────────┐
│ User         │
└──────┬───────┘
       │ Email + Password
       ↓
┌──────────────────────┐
│ Login Page           │
└──────┬───────────────┘
       │ POST /api/auth/login
       ↓
┌──────────────────────────────┐
│ Backend                      │
│ - Find user by email         │
│ - Verify password (bcrypt)   │
│ - Generate JWT token         │
│ - Set expiration (7 days)    │
└──────┬───────────────────────┘
       │ Return token
       ↓
┌──────────────────────────────┐
│ Frontend                     │
│ - Store token in localStorage
│ - Redirect to marketplace    │
└──────────────────────────────┘
```

### 3. Book Listing Flow
```
┌──────────┐
│ User     │
└────┬─────┘
     │ Click "Add Book"
     ↓
┌──────────────────┐
│ Add Book Page    │
└────┬─────────────┘
     │ Fill form
     │ Submit
     ↓
┌──────────────────────────────┐
│ POST /api/books              │
│ Header: Authorization: JWT   │
└────┬─────────────────────────┘
     │
     ↓
┌──────────────────────────────┐
│ Backend Middleware           │
│ - Verify JWT token           │
│ - Extract user ID            │
└────┬─────────────────────────┘
     │ Token valid
     ↓
┌──────────────────────────────┐
│ Insert into books table      │
│ - Set owner_id from JWT      │
│ - Save all fields            │
│ - Return book data           │
└────┬─────────────────────────┘
     │ ✓ Success
     ↓
┌──────────────────────────────┐
│ Show success toast           │
│ Redirect to My Books         │
└──────────────────────────────┘
```

---

## 🗄️ Database Schema & Relationships

```
┌─────────────────────────┐
│       users             │
├─────────────────────────┤
│ PK  id                  │
│     name                │
│ UQ  email               │
│     password_hash       │
│     is_verified         │
│     created_at          │
└────────────┬────────────┘
             │
             │ 1:N (one user has many)
             │
             ├──────────────────────────────┐
             │                              │
             ↓                              ↓
   ┌──────────────────────┐    ┌──────────────────────┐
   │ verification_codes   │    │ books                │
   ├──────────────────────┤    ├──────────────────────┤
   │ PK id                │    │ PK id                │
   │ FK user_id ──────┐   │    │ title                │
   │ code             │   │    │ description          │
   │ expires_at       │   │    │ price                │
   │ created_at       │   │    │ condition            │
   │                  │   │    │ image_url            │
   └──────────────────┘   │    │ FK owner_id ────┐    │
                          │    │ created_at       │    │
                          │    └──────────────────┘    │
                          │           ↑                │
                          └───────────┴────────────────┘
```

### Entity Relationships
- **users → books**: 1:N (one user can have many books)
- **users → verification_codes**: 1:N (one user can have multiple codes)
- **books.owner_id**: Foreign key to users.id (ON DELETE CASCADE)

---

## 🔐 Authentication & Authorization

### JWT Token Structure
```
Header.Payload.Signature

Payload contains:
{
  "id": 1,
  "email": "user@students.hebron.edu",
  "name": "User Name",
  "iat": 1622505600,
  "exp": 1623110400
}
```

### Protected Routes
```
GET    /api/books/user/my-books    ← Requires token
POST   /api/books                  ← Requires token
DELETE /api/books/:id              ← Requires token
GET    /api/books                  ← Public
GET    /api/books/search           ← Public
GET    /api/books/:id              ← Public
```

### Token Validation Flow
```
1. Client sends request with Authorization header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

2. Middleware intercepts request
   ↓
3. Extract token from header
   ↓
4. Verify with JWT_SECRET
   ↓
5. If valid:
   - Decode payload
   - Attach user data to request
   - Continue to controller
   ↓
6. If invalid:
   - Return 401 Unauthorized
   - Redirect to login (frontend)
```

---

## 📡 API Communication

### Request Format
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@students.hebron.edu",
  "password": "password123"
}
```

### Response Format (Success)
```javascript
HTTP 200 OK
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@students.hebron.edu"
  }
}
```

### Response Format (Error)
```javascript
HTTP 400 Bad Request
{
  "error": "Invalid email or password"
}
```

---

## 🎨 Frontend State Management

```
┌─────────────────────────────────┐
│   Browser Memory                │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │ localStorage                ││
│  ├─────────────────────────────┤│
│  │ token: "eyJhbGci..."        ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ JavaScript Variables        ││
│  ├─────────────────────────────┤│
│  │ currentUser = {...}         ││
│  │ pendingUserId = 123         ││
│  │ verificationCode = "123456" ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ DOM Elements                ││
│  ├─────────────────────────────┤│
│  │ Books Grid                  ││
│  │ Filter Inputs               ││
│  │ Modal Content               ││
│  │ Toast Notifications         ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

---

## 🔄 Data Flow Example: Adding a Book

```
Frontend                Backend              Database
   │                       │                     │
   │  1. User fills form    │                     │
   │                        │                     │
   │  2. Validate locally   │                     │
   ├────────────────────────┼─ 3. POST /api/books
   │   (with JWT token)     │                     │
   │                        │                     │
   │                        ├─ 4. Verify JWT    │
   │                        │                     │
   │                        ├─ 5. Validate data │
   │                        │                     │
   │                        ├────────────────────►  6. INSERT INTO books
   │                        │                     │
   │                        │◄────────────────────  7. Return book ID
   │                        │                     │
   │◄────────────────────────  8. JSON response │
   │  {success, bookId}     │                     │
   │                        │                     │
   │  9. Show success toast │                     │
   │  10. Redirect to       │                     │
   │      My Books          │                     │
```

---

## 🚀 Deployment Architecture

### Development
```
localhost:3000  ←→  localhost:5000  ←→  PostgreSQL
(Frontend)            (Node/Express)      (Database)
```

### Production (Example: Heroku + Vercel)
```
vercel.app           heroku.app          Heroku PostgreSQL
(Frontend)  ←→  (Node/Express)  ←→  (Database)
             HTTPS + CORS
```

---

## 📊 Performance Considerations

### Frontend
- ✓ Lazy load images
- ✓ Debounce search input
- ✓ Cache search results
- ✓ Minify CSS/JS for production
- ✓ Use CDN for static assets

### Backend
- ✓ Add database indexes on `email`, `owner_id`
- ✓ Implement pagination for large datasets
- ✓ Cache frequently accessed data (Redis)
- ✓ Use connection pooling (already done: pg)
- ✓ Add compression middleware

### Database
- ✓ Index: users.email
- ✓ Index: books.owner_id
- ✓ Index: books.created_at
- ✓ Foreign key constraints (referential integrity)

---

## 🔒 Security Layers

```
┌──────────────────────────────────┐
│ Layer 1: Frontend Validation     │
│ - Check email format             │
│ - Validate required fields       │
│ - XSS protection (escapeHtml)    │
└──────────────────────────────────┘
                ↓
┌──────────────────────────────────┐
│ Layer 2: Transport Security      │
│ - HTTPS in production            │
│ - CORS validation                │
│ - Headers validation             │
└──────────────────────────────────┘
                ↓
┌──────────────────────────────────┐
│ Layer 3: Backend Validation      │
│ - Email domain check             │
│ - Input sanitization             │
│ - Rate limiting                  │
└──────────────────────────────────┘
                ↓
┌──────────────────────────────────┐
│ Layer 4: Authentication          │
│ - JWT verification               │
│ - Token expiration check         │
│ - User identity confirmation     │
└──────────────────────────────────┘
                ↓
┌──────────────────────────────────┐
│ Layer 5: Authorization           │
│ - Role-based access control      │
│ - Resource ownership check       │
│ - Permission validation          │
└──────────────────────────────────┘
                ↓
┌──────────────────────────────────┐
│ Layer 6: Data Protection         │
│ - Password hashing (bcryptjs)    │
│ - SQL injection prevention       │
│ - Data encryption at rest        │
└──────────────────────────────────┘
```

---

## 📈 Scalability Path

### Current (Single Server)
```
Users → Frontend → Backend → PostgreSQL
```

### Scale Phase 1 (Add caching)
```
Users → Frontend → Cache (Redis) → Backend → PostgreSQL
```

### Scale Phase 2 (Multiple backends)
```
Users → CDN → Load Balancer → [Backend 1, Backend 2, Backend 3] → PostgreSQL
```

### Scale Phase 3 (Database replication)
```
        ┌─→ Replica 1 (Read-only)
Users → Load Balancer ← Primary DB (Write)
        └─→ Replica 2 (Read-only)
```

---

## 🧪 Testing Strategy

```
┌─────────────────────────┐
│ Unit Tests              │
├─────────────────────────┤
│ - Password hashing      │
│ - Email validation      │
│ - Token generation      │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│ Integration Tests       │
├─────────────────────────┤
│ - Auth flow             │
│ - Book CRUD             │
│ - Search & filter       │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│ End-to-End Tests        │
├─────────────────────────┤
│ - Full user journey     │
│ - Cross-browser testing │
│ - Mobile responsiveness │
└─────────────────────────┘
```

---

**Architecture designed for scalability, security, and maintainability** ✨

Last Updated: June 2026
