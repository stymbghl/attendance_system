# Attendance App - Detailed Implementation Plan

## Overview
Build an attendance tracking application with user registration, login, attendance marking, and report generation. Admin users can download reports for all users.

## Tech Stack
- **Backend**: Node.js + Express
- **Database**: SQLite (via Docker)
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Authentication**: JWT tokens

---

## Project Structure

```
attendence/
├── docker-compose.yml
├── .env
├── .gitignore
├── package.json
├── server/
│   ├── index.js                 # Express app entry point
│   ├── config/
│   │   └── db.js               # SQLite connection setup
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js             # Register/login routes
│   │   ├── attendance.js       # Attendance CRUD routes
│   │   └── reports.js          # Report generation routes
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── attendanceController.js
│   │   └── reportsController.js
│   └── utils/
│       ├── jwt.js              # JWT token utilities
│       └── csvGenerator.js     # CSV generation logic
├── public/
│   ├── index.html              # Login/Register page
│   ├── home.html               # User dashboard
│   ├── attendance.html         # Attendance form
│   ├── admin.html              # Admin dashboard
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── auth.js             # Login/register logic
│       ├── attendance.js       # Attendance form logic
│       ├── reports.js          # Report download logic
│       └── api.js              # Shared API call utilities
└── db/
    └── init.sql                # Database schema
```

---

## Database Schema

### Table: users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,        -- Hashed with bcrypt
    isAdmin INTEGER DEFAULT 0,     -- 0 = regular user, 1 = admin
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: attendance
```sql
CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    date TEXT NOT NULL,            -- Format: YYYY-MM-DD
    hasConsent INTEGER NOT NULL,   -- 0 = no consent, 1 = has consent
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    UNIQUE(userId, date)           -- Prevent duplicate entries
);
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
}
```
**Response (201):**
```json
{
    "message": "User registered successfully",
    "userId": 1
}
```

#### POST `/api/auth/login`
**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "securepassword123"
}
```
**Response (200):**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "isAdmin": 0
    }
}
```

---

### Attendance Routes (`/api/attendance`)
*All routes require JWT authentication*

#### POST `/api/attendance`
**Request Body:**
```json
{
    "date": "2025-10-30",
    "hasConsent": true
}
```
**Response (201):**
```json
{
    "message": "Attendance marked successfully",
    "id": 1
}
```

#### GET `/api/attendance`
*Get user's own attendance records*
**Query Params:** `?startDate=2025-10-01&endDate=2025-10-31` (optional)
**Response (200):**
```json
[
    {
        "id": 1,
        "date": "2025-10-30",
        "hasConsent": 1,
        "createdAt": "2025-10-30T10:30:00Z"
    }
]
```

---

### Report Routes (`/api/reports`)
*All routes require JWT authentication*

#### GET `/api/reports/my-attendance`
**Response:** CSV file download
```csv
Date,Consent Given,Submitted At
2025-10-30,Yes,2025-10-30 10:30:00
```

#### GET `/api/reports/all-users`
*Admin only*
**Response:** CSV file download
```csv
User Name,Email,Date,Consent Given,Submitted At
John Doe,john@example.com,2025-10-30,Yes,2025-10-30 10:30:00
```

---

## Implementation Tasks

### Phase 1: Infrastructure Setup

#### Task 1.1: Docker Setup
- [ ] Create `docker-compose.yml`
  - SQLite service with volume mount for persistence
  - Expose necessary ports
- [ ] Create `.gitignore` (node_modules, .env, db files)
- [ ] Create `.env` file with:
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `DATABASE_PATH`
  - `PORT`

#### Task 1.2: Node.js Project Initialization
- [ ] Run `npm init -y`
- [ ] Install dependencies:
  - `express` - web framework
  - `sqlite3` - database driver
  - `bcryptjs` - password hashing
  - `jsonwebtoken` - JWT authentication
  - `dotenv` - environment variables
  - `cors` - CORS support
  - `express-validator` - input validation
- [ ] Create basic folder structure

#### Task 1.3: Database Setup
- [ ] Create `db/init.sql` with schema
- [ ] Create `server/config/db.js`:
  - Initialize SQLite connection
  - Run init.sql on first setup
  - Export db connection
- [ ] Test database connection

---

### Phase 2: Backend Development

#### Task 2.1: JWT Utilities
- [ ] Create `server/utils/jwt.js`:
  - `generateToken(userId, isAdmin)` - creates JWT
  - `verifyToken(token)` - validates and decodes JWT

#### Task 2.2: Authentication Middleware
- [ ] Create `server/middleware/auth.js`:
  - `authenticateToken` - validates JWT from Authorization header
  - Extracts userId and isAdmin from token
  - Attaches user info to req.user
  - Returns 401 if invalid/missing token
- [ ] Create `requireAdmin` middleware:
  - Checks if req.user.isAdmin === 1
  - Returns 403 if not admin

#### Task 2.3: Auth Controller & Routes
- [ ] Create `server/controllers/authController.js`:
  - `register(req, res)`:
    - Validate input (name, email, password)
    - Check if email exists
    - Hash password with bcrypt
    - Insert into users table
    - Return success message
  - `login(req, res)`:
    - Validate input
    - Find user by email
    - Compare password with bcrypt
    - Generate JWT token
    - Return token and user info (without password)

- [ ] Create `server/routes/auth.js`:
  - POST `/register` → authController.register
  - POST `/login` → authController.login

#### Task 2.4: Attendance Controller & Routes
- [ ] Create `server/controllers/attendanceController.js`:
  - `markAttendance(req, res)`:
    - Validate date and hasConsent
    - Check for duplicate (userId + date)
    - If duplicate, return 409 Conflict
    - Insert into attendance table
    - Return success
  - `getMyAttendance(req, res)`:
    - Query attendance by req.user.id
    - Optional date range filtering
    - Return attendance records

- [ ] Create `server/routes/attendance.js`:
  - POST `/` → attendanceController.markAttendance (with auth)
  - GET `/` → attendanceController.getMyAttendance (with auth)

#### Task 2.5: Reports Controller & Routes
- [ ] Create `server/utils/csvGenerator.js`:
  - `generateUserCSV(rows)` - converts user attendance to CSV
  - `generateAllUsersCSV(rows)` - converts all attendance to CSV
  - Proper escaping of CSV values

- [ ] Create `server/controllers/reportsController.js`:
  - `getMyReport(req, res)`:
    - Query user's attendance records
    - Generate CSV
    - Set response headers (Content-Type, Content-Disposition)
    - Send CSV file
  - `getAllUsersReport(req, res)`:
    - Join users and attendance tables
    - Generate CSV with user info
    - Send CSV file

- [ ] Create `server/routes/reports.js`:
  - GET `/my-attendance` → reportsController.getMyReport (with auth)
  - GET `/all-users` → reportsController.getAllUsersReport (with auth + admin)

#### Task 2.6: Main Server Setup
- [ ] Create `server/index.js`:
  - Initialize Express app
  - Load environment variables
  - Add middleware (cors, express.json, express.static for public folder)
  - Register routes:
    - `/api/auth` → authRoutes
    - `/api/attendance` → attendanceRoutes
    - `/api/reports` → reportsRoutes
  - Global error handler
  - Start server

---

### Phase 3: Frontend Development

#### Task 3.1: Shared Utilities
- [ ] Create `public/js/api.js`:
  - `getAuthToken()` - retrieves JWT from localStorage
  - `setAuthToken(token)` - stores JWT in localStorage
  - `clearAuthToken()` - removes JWT
  - `apiCall(endpoint, options)` - wrapper for fetch with auth header
  - `handleApiError(error)` - centralized error handling

#### Task 3.2: Login/Register Page
- [ ] Create `public/index.html`:
  - Two forms: Login and Register
  - Toggle between forms with JS
  - Input fields: name (register only), email, password
  - Submit buttons
  - Simple, clean layout
  - Link styles.css and auth.js

- [ ] Create `public/js/auth.js`:
  - `handleRegister(event)`:
    - Prevent default form submission
    - Get form values
    - Validate inputs (non-empty, valid email)
    - Call `/api/auth/register`
    - Show success message, switch to login form
  - `handleLogin(event)`:
    - Prevent default
    - Get email and password
    - Call `/api/auth/login`
    - Store JWT token
    - Store user info in localStorage
    - Redirect to home.html or admin.html based on isAdmin
  - Attach event listeners to forms

#### Task 3.3: User Dashboard
- [ ] Create `public/home.html`:
  - Welcome message with user name
  - Two buttons:
    - "Mark Attendance" → redirects to attendance.html
    - "Download My Report" → triggers report download
  - Logout button
  - Link styles.css and reports.js

- [ ] Update `public/js/reports.js`:
  - `downloadMyReport()`:
    - Call `/api/reports/my-attendance`
    - Trigger browser download
  - `logout()`:
    - Clear auth token and user info
    - Redirect to index.html

#### Task 3.4: Attendance Form
- [ ] Create `public/attendance.html`:
  - Form with:
    - Date input (type="date")
    - Checkbox for consent
    - Submit button
    - Back to Dashboard link
  - Link styles.css and attendance.js

- [ ] Create `public/js/attendance.js`:
  - Check authentication on page load
  - `handleSubmitAttendance(event)`:
    - Prevent default
    - Get date and consent values
    - Validate inputs
    - Call `/api/attendance`
    - Handle success (show message, clear form)
    - Handle 409 Conflict (show "already marked" message)

#### Task 3.5: Admin Dashboard
- [ ] Create `public/admin.html`:
  - Welcome message with admin name
  - Three buttons:
    - "Mark Attendance" → redirects to attendance.html
    - "Download My Report"
    - "Download All Users Report"
  - Logout button
  - Link styles.css and reports.js

- [ ] Update `public/js/reports.js`:
  - `downloadAllUsersReport()`:
    - Call `/api/reports/all-users`
    - Trigger browser download
    - Handle 403 Forbidden (not admin)

#### Task 3.6: Styling
- [ ] Create `public/css/styles.css`:
  - Clean, minimal design
  - Readable fonts and spacing
  - Form styling (inputs, buttons, checkboxes)
  - Responsive layout
  - Simple color scheme
  - Button hover states
  - Error/success message styles

---

### Phase 4: Integration & Testing

#### Task 4.1: End-to-End Testing
- [ ] Test user registration flow
- [ ] Test login flow (regular user)
- [ ] Test marking attendance (success case)
- [ ] Test marking duplicate attendance (should fail)
- [ ] Test downloading user report
- [ ] Manually set isAdmin=1 in database
- [ ] Test admin login (should redirect to admin.html)
- [ ] Test admin downloading all users report
- [ ] Test non-admin accessing admin endpoint (should fail)
- [ ] Test JWT expiration handling
- [ ] Test logout and re-authentication

#### Task 4.2: Error Handling & Edge Cases
- [ ] Invalid email format during registration
- [ ] Duplicate email registration
- [ ] Wrong password during login
- [ ] Missing JWT token
- [ ] Invalid/expired JWT token
- [ ] Missing required fields in forms
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize inputs)

---

## Code Quality Guidelines

Following the user's preferences for human-readable code:

### 1. Meaningful Variable Names
```javascript
// Good
const isConsentGiven = req.body.hasConsent;
const isDuplicateEntry = existingRecord !== null;

// Avoid
const c = req.body.hasConsent;
const dup = existingRecord !== null;
```

### 2. Readable Conditionals
```javascript
// Good
const isValidDate = dateString && dateString.length === 10;
const hasRequiredFields = date && hasConsent !== undefined;

if (isValidDate && hasRequiredFields) {
    // Process attendance
}

// Avoid
if (dateString && dateString.length === 10 && date && hasConsent !== undefined) {
    // Too much to hold in memory
}
```

### 3. Early Returns
```javascript
// Good
async function markAttendance(req, res) {
    const { date, hasConsent } = req.body;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    if (hasConsent === undefined) {
        return res.status(400).json({ error: 'Consent is required' });
    }

    const isDuplicate = await checkDuplicate(userId, date);
    if (isDuplicate) {
        return res.status(409).json({ error: 'Attendance already marked' });
    }

    // Happy path - working memory is clear
    const result = await insertAttendance(userId, date, hasConsent);
    return res.status(201).json(result);
}
```

### 4. Deep Functions Over Shallow Ones
```javascript
// Good - Deep function with simple interface, complex functionality
function generateAttendanceCSV(records) {
    // All CSV generation logic in one place
    // Simple to call, complex implementation hidden
}

// Avoid - Too many shallow functions
function createCSVHeader() { ... }
function addCSVRow(row) { ... }
function escapeCSVValue(value) { ... }
function formatCSVDate(date) { ... }
// Forces reader to understand all interactions
```

### 5. Minimal Abstractions
- Use direct SQLite queries instead of heavy ORM unless complexity demands it
- Avoid over-engineering with too many layers
- Keep related logic together when it makes sense

---

## Security Considerations

1. **Password Security**: Use bcrypt with appropriate salt rounds (10-12)
2. **JWT Secret**: Use strong, random secret in production
3. **SQL Injection**: Always use parameterized queries
4. **XSS Protection**: Sanitize user inputs, escape outputs
5. **CORS**: Configure appropriately for production
6. **HTTPS**: Use in production (handled by deployment environment)
7. **Rate Limiting**: Consider adding for production

---

## Deployment Notes

1. Ensure SQLite database persists via Docker volume
2. Set environment variables securely
3. Use production-ready JWT secret
4. Consider adding rate limiting
5. Set appropriate CORS origins
6. Add logging for production debugging

---

## Future Enhancements (Out of Scope)

- Password reset functionality
- Email verification
- Edit/delete attendance entries
- Date range reports in UI
- Dashboard with attendance statistics
- Multi-factor authentication
- User profile management
