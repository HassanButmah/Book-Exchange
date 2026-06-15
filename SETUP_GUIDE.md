# 🚀 HU Book Exchange - Complete Setup Guide

This guide will walk you through setting up and running the full-stack HU Book Exchange application on your local machine.

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Prerequisites

**Windows:**
1. Download Node.js from https://nodejs.org/ (LTS version)
2. Download PostgreSQL from https://www.postgresql.org/download/windows/
3. Install both with default settings

**Mac:**
```bash
brew install node
brew install postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install nodejs npm postgresql postgresql-contrib
```

### Step 2: Create Database

**Windows (Command Prompt):**
```cmd
psql -U postgres
```

**Mac/Linux (Terminal):**
```bash
psql -U postgres
```

Then run:
```sql
CREATE DATABASE hu_book_exchange;
\q
```

### Step 3: Setup Backend

```bash
cd server
npm install
```

Update `.env` file with your PostgreSQL credentials:
```env
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hu_book_exchange
JWT_SECRET=your_super_secret_jwt_key_12345
PORT=5000
```

### Step 4: Start Backend

```bash
npm start
```

You should see:
```
🚀 Server running on http://localhost:5000
📚 HU Book Exchange Backend Started
✓ Database schema initialized
✓ Seeded 5 demo books
📚 Demo Accounts:
  Student: demo@students.hebron.edu / password123
  Admin:   admin@students.hebron.edu / admin123
```

### Step 5: Start Frontend

Open a NEW terminal in the `/frontend` folder:

**Option 1: Python (if installed)**
```bash
python -m http.server 3000
```

**Option 2: Node.js**
```bash
npx http-server -p 3000
```

**Option 3: VS Code (easiest)**
- Install "Live Server" extension
- Right-click `index.html`
- Click "Open with Live Server"

### Step 6: Open in Browser

Navigate to: **http://localhost:3000**

---

## 📝 First-Time User Flow

### 1. Test with Demo Account (No Registration)

```
Email: demo@students.hebron.edu
Password: password123
```

✅ This account is pre-verified and ready to use  
✅ View 5 demo books in marketplace  
✅ Add your own books  

### 2. Register a New Account

1. Click **Register** button
2. Fill in:
   - Full Name
   - Email: `yourname@students.hebron.edu`
   - Password (min 6 characters)
3. Submit form
4. **⚠️ IMPORTANT:** Check **browser console (F12)** for verification code
5. Paste code into verification dialog
6. Email verified! Ready to login

### 3. Browse Marketplace

- Click **Marketplace** or **Browse Books**
- Search by book title
- Filter by condition (New/Used)
- Filter by price range
- Click any book to see details

### 4. Add Your Book

1. Login with your account
2. Click **Add Book**
3. Fill in:
   - Title
   - Description
   - Price (ILS)
   - Condition (New/Used)
   - Image URL (optional)
4. Click **Add Book**
5. View in **My Books**

---

## 🔧 Troubleshooting

### Issue: "Can't connect to database"

**Solution:**
```bash
# Check if PostgreSQL is running
# Windows: Search for "Services" → PostgreSQL should be running
# Mac: brew services list | grep postgresql
# Linux: sudo systemctl status postgresql

# If not running:
# Windows: net start postgresql-x64-15
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Issue: "Port 5000 already in use"

**Solution:**
Change PORT in `server/.env`:
```env
PORT=5001
```

Then access backend at: `http://localhost:5001`

### Issue: "Backend URL error"

**Solution:**
Update `API_BASE_URL` in `frontend/app.js`:
```javascript
const API_BASE_URL = 'http://localhost:5001/api'; // if using port 5001
```

### Issue: "Module not found" error

**Solution:**
```bash
cd server
npm install

# Or reinstall everything
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Email verification code not showing"

**Solution:**
1. Open browser **Developer Tools (F12)**
2. Go to **Console** tab
3. You'll see: `[VERIFICATION CODE FOR email@...]: 123456`
4. Use that code in the verification form

### Issue: "Login fails with valid credentials"

**Solution:**
1. Make sure email ends with `@students.hebron.edu`
2. Make sure email is verified
3. Check that backend is running
4. Check browser console for errors

---

## 📚 Demo Accounts

Pre-created in database:

| Role | Email | Password | Status |
|------|-------|----------|--------|
| Student | demo@students.hebron.edu | password123 | ✅ Verified |
| Admin | admin@students.hebron.edu | admin123 | ✅ Verified |

---

## 🌐 File Structure

```
HU Book Exchange/
├── frontend/
│   ├── index.html          # Landing page
│   ├── register.html       # Registration
│   ├── login.html          # Login
│   ├── marketplace.html    # Browse books
│   ├── add-book.html       # Create listing
│   ├── my-books.html       # Manage listings
│   ├── style.css           # All styles
│   └── app.js              # Frontend logic
│
├── server/
│   ├── index.js            # Express server
│   ├── db.js               # Database setup
│   ├── seed.js             # Demo data
│   ├── package.json        # Dependencies
│   ├── .env                # Configuration
│   ├── routes/
│   │   ├── auth.js         # Auth endpoints
│   │   └── books.js        # Book endpoints
│   ├── controllers/
│   │   ├── authController.js
│   │   └── bookController.js
│   └── middleware/
│       └── auth.js         # JWT middleware
│
└── README.md               # Documentation
```

---

## 🔒 Security Notes

⚠️ **Development Only**

The following are configured for development/testing:

1. **Email Verification** - Logged to console instead of sent
2. **JWT Secret** - Generic, should be changed in production
3. **CORS** - Open to all origins
4. **Database** - No encryption at rest

**For Production:**
- Use real email service (Nodemailer/SendGrid)
- Generate strong JWT secret
- Restrict CORS origins
- Enable database encryption
- Use HTTPS
- Add rate limiting
- Add input validation

---

## 📱 Test Checklist

After setup, test these features:

- [ ] Landing page loads at http://localhost:3000
- [ ] Can register new account with @students.hebron.edu email
- [ ] Can verify email with console code
- [ ] Can login with credentials
- [ ] Can view marketplace with 5 demo books
- [ ] Can search books by title
- [ ] Can filter by condition
- [ ] Can filter by price
- [ ] Can add new book when logged in
- [ ] Can view own books in "My Books"
- [ ] Can delete own books
- [ ] Logout redirects to landing page

---

## 🚢 Deployment

### Backend (Heroku)

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET=your_secret_key
git push heroku main
```

### Frontend (Netlify)

1. Push frontend folder to GitHub
2. Connect to Netlify
3. Set build command: `echo "No build needed"`
4. Set publish directory: `frontend`
5. Update `API_BASE_URL` in app.js to production backend

---

## 💻 Development Tips

### Hot Reload (Frontend)

Use VS Code Live Server extension for automatic refresh on save.

### Debug Backend

```bash
# Run with verbose logging
NODE_ENV=development npm start
```

Check console output for errors.

### Check Database

```bash
psql -U postgres -d hu_book_exchange
\dt  # List tables
SELECT * FROM users;
SELECT * FROM books;
\q
```

---

## 📞 Common Commands

```bash
# Backend
cd server
npm install          # Install dependencies
npm start            # Start server

# Database
psql -U postgres     # Connect to PostgreSQL
CREATE DATABASE hu_book_exchange;  # Create DB
\c hu_book_exchange  # Connect to database
\dt                  # List tables

# Frontend
cd frontend
python -m http.server 3000  # Start server

# Check ports
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000
```

---

## ✅ You're All Set!

You should now have:

✅ PostgreSQL database with schema  
✅ Backend API running on localhost:5000  
✅ Frontend running on localhost:3000  
✅ Demo accounts ready to test  
✅ Sample books in marketplace  

**Start exploring! 📚**

---

## 🆘 Still Having Issues?

1. **Check terminal output** - Read error messages carefully
2. **Open browser console (F12)** - Look for JavaScript errors
3. **Check backend logs** - See what requests are being made
4. **Verify PostgreSQL** - Make sure database exists
5. **Restart everything** - Sometimes a fresh start helps

If issues persist, check:
- Are you in the correct directory?
- Is .env configured correctly?
- Is port 5000 available?
- Is PostgreSQL running?
- Node.js version compatible?

---

Made with ❤️ for Hebron University Students 📚
