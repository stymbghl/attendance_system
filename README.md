# Attendance Tracking Application

A simple attendance tracking web application with user registration, login, attendance marking, and report generation features. Admin users can download attendance reports for all users.

## Features

- User registration and authentication using JWT tokens
- Mark daily attendance with consent tracking
- Download personal attendance reports as CSV
- Admin dashboard with access to all users' attendance data
- Secure password storage using bcrypt
- SQLite database for data persistence
- Clean, responsive UI

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Project Structure

```
attendence/
├── server/                  # Backend code
│   ├── config/             # Database configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth middleware
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions (JWT, CSV)
│   └── index.js           # Server entry point
├── public/                # Frontend code
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── *.html             # HTML pages
├── db/                    # Database files
│   ├── init.sql          # Database schema
│   └── attendance.db     # SQLite database (auto-generated)
├── .env                   # Environment variables
├── package.json
└── README.md
```

## Installation & Setup

### 1. Clone or navigate to the project directory

```bash
cd /path/to/attendence
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

The `.env` file is already created with default values:

```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
DATABASE_PATH=./db/attendance.db
PORT=3000
```

**Important**: Change the `JWT_SECRET` to a strong random string in production!

### 4. Start the application

```bash
npm start
```

The server will start on `http://localhost:3000`

The database will be automatically created and initialized on first run.

## Using the Application

### 1. Register a New User

- Open `http://localhost:3000` in your browser
- Click "Register here"
- Fill in your name, email, and password (minimum 6 characters)
- Click "Register"
- You'll be redirected to the login form

### 2. Login

- Enter your email and password
- Click "Login"
- Regular users will see the User Dashboard
- Admin users will see the Admin Dashboard

### 3. Mark Attendance

- Click "Mark Attendance"
- Select a date
- Check the consent checkbox
- Click "Submit Attendance"
- You cannot mark attendance twice for the same date

### 4. Download Reports

**For Regular Users:**
- Click "Download Report" to get your personal attendance CSV

**For Admin Users:**
- Click "Download Report" for personal attendance
- Click "Download All Users" for everyone's attendance

### 5. Create an Admin User

Admin privileges must be set manually in the database:

```bash
# Start sqlite3
sqlite3 db/attendance.db

# Set user as admin (replace email with actual admin email)
UPDATE users SET isAdmin = 1 WHERE email = 'admin@example.com';

# Exit sqlite3
.exit
```

Then login with that user's credentials to access admin features.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Attendance (requires authentication)

- `POST /api/attendance` - Mark attendance
- `GET /api/attendance` - Get user's attendance records

### Reports (requires authentication)

- `GET /api/reports/my-attendance` - Download personal report (CSV)
- `GET /api/reports/all-users` - Download all users report (CSV, admin only)

## Database Schema

### Users Table

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

### Attendance Table

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

## Running with Docker (Optional)

If you prefer to use Docker:

```bash
docker-compose up
```

This will start the application in a containerized environment.

To stop:

```bash
docker-compose down
```

## Troubleshooting

### Database Issues

If you encounter database errors, delete the database file and restart:

```bash
rm db/attendance.db
npm start
```

The database will be recreated automatically.

### Port Already in Use

If port 3000 is already in use, change it in `.env`:

```
PORT=3001
```

### Cannot Login After Registration

Make sure you're using the same email and password you registered with. Passwords are case-sensitive.

## Security Considerations

- Passwords are hashed using bcrypt before storage
- JWT tokens expire after 24 hours (configurable)
- All attendance and report endpoints require authentication
- Admin endpoints verify admin status
- Input validation on all forms

## Production Deployment

Before deploying to production:

1. Change `JWT_SECRET` to a strong random string
2. Set up HTTPS (using reverse proxy like nginx)
3. Consider adding rate limiting
4. Set appropriate CORS origins
5. Use environment-specific `.env` files
6. Set up proper logging
7. Use a more robust database (PostgreSQL, MySQL) if needed

## Testing the Application

### Test User Flow

1. Register a new user
2. Login with the credentials
3. Mark attendance for today
4. Try marking attendance again (should fail with "already marked")
5. Download your attendance report
6. Logout

### Test Admin Flow

1. Register a user
2. Set that user as admin in database
3. Login as admin
4. Access admin dashboard
5. Download all users report
6. Verify CSV contains data from all users

## License

ISC

## Support

For issues or questions, please refer to the task.md file for detailed implementation specifications.
