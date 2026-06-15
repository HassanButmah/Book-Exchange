# HU Book Exchange - Full Stack Production Application

A modern, beautiful book marketplace platform for Hebron University students to buy, sell, and exchange used textbooks.

## 🎯 Features

✅ **Student-Only Access** - University email (@students.hebron.edu) verification  
✅ **Email OTP Verification** - 6-digit verification codes  
✅ **JWT Authentication** - Secure token-based auth  
✅ **Add/Manage Books** - Create, view, and delete listings  
✅ **Advanced Search** - Search by title, filter by condition and price  
✅ **Modern UI** - Responsive, smooth animations, professional design  
✅ **PostgreSQL Database** - Persistent data storage  

## 📋 Tech Stack

**Frontend:**
- HTML5 + CSS3 + Vanilla JavaScript
- Responsive grid layout
- Smooth animations & transitions
- No frameworks (pure JS)

**Backend:**
- Node.js + Express.js
- REST API architecture
- PostgreSQL database
- JWT & bcrypt security

**Security:**
- Password hashing with bcryptjs
- JWT token authentication
- Email domain validation
- Protected routes

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### 1. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend (just serve the files via HTTP server)
cd ../frontend
# Use any HTTP server (Python, Node, VS Code Live Server, etc.)
```

### 2. Configure Database

Create PostgreSQL database:
```sql
CREATE DATABASE hu_book_exchange;
```

### 3. Environment Setup

Edit `server/.env`:
```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hu_book_exchange
JWT_SECRET=your_secure_jwt_secret_key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 4. Start Backend Server

```bash
cd server
npm start
```

Expected output:
```
🚀 Server running on http://localhost:5000
📚 HU Book Exchange Backend Started
✓ Database schema initialized
```

### 5. Start Frontend

Option A: Python HTTP Server
```bash
cd frontend
python -m http.server 3000
```

Option B: Node.js HTTP Server
```bash
cd frontend
npx http-server -p 3000
```

Option C: VS Code Live Server
- Right-click `frontend/index.html` → "Open with Live Server"

### 6. Access Application

Open browser: `http://localhost:3000`

## 👥 Demo Accounts

### Student Account
```
Email: demo@students.hebron.edu
Password: password123
```

### Admin Account (also a student)
```
Email: admin@students.hebron.edu
Password: admin123
```

**Note:** These accounts are created when the backend first runs. Check browser console (F12) for email verification codes during testing.

## 📁 Project Structure

```
/server
  ├── index.js                 # Express server entry point
  ├── db.js                    # PostgreSQL connection & schema
  ├── package.json
  ├── .env                     # Environment variables
  ├── routes/
  │   ├── auth.js              # Authentication routes
  │   └── books.js             # Book management routes
  ├── controllers/
  │   ├── authController.js    # Auth logic
  │   └── bookController.js    # Book logic
  └── middleware/
      └── auth.js              # JWT verification middleware

/frontend
  ├── index.html               # Landing page
  ├── register.html            # Registration page
  ├── login.html               # Login page
  ├── marketplace.html         # Browse books
  ├── add-book.html            # Create listing
  ├── my-books.html            # User's listings
  ├── style.css                # All styles
  └── app.js                   # Frontend JavaScript
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify` - Verify email with OTP
- `POST /api/auth/login` - Login user

### Books
- `GET /api/books` - Get all books
- `GET /api/books/search?q=...` - Search books
- `GET /api/books/user/my-books` - Get user's books (auth required)
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Add book (auth required)
- `DELETE /api/books/:id` - Delete book (auth required)

## 🔐 Security Features

- **Password Hashing**: bcryptjs with 10 salt rounds
- **JWT Tokens**: 7-day expiration
- **Email Validation**: Must use @students.hebron.edu
- **OTP Verification**: 15-minute expiration on codes
- **Protected Routes**: Backend checks auth middleware
- **CORS**: Configured for frontend origin

## 🎨 UI/UX Highlights

- Modern gradient animations
- Smooth card hover effects
- Loading spinners
- Toast notifications
- Responsive grid layouts
- Mobile-first design
- Professional typography
- Consistent color scheme

## 🧪 Testing

### Manual Testing

1. **Register Flow**
   - Navigate to Register page
   - Enter name, university email, password
   - Check console (F12) for verification code
   - Enter code to verify email
   - Login with credentials

2. **Book Management**
   - Login
   - Click "Add Book"
   - Fill form with book details
   - Submit to create listing
   - View in "My Books"
   - Delete if needed

3. **Marketplace**
   - Browse all books
   - Search by title
   - Filter by condition
   - Filter by price range
   - Click book to view details

### Using Demo Accounts

1. Use `demo@students.hebron.edu` / `password123`
2. Check console for OTP (test only - not real email)
3. Browse existing books
4. Add your own book

## 📊 Database Schema

### users
- id (PK)
- name
- email (UNIQUE)
- password_hash
- is_verified (BOOLEAN)
- created_at

### verification_codes
- id (PK)
- user_id (FK)
- code (VARCHAR 6)
- expires_at
- created_at

### books
- id (PK)
- title
- description
- price (DECIMAL)
- condition (ENUM: New/Used)
- image_url
- owner_id (FK)
- created_at

## 🌐 Deployment

### Heroku Deployment

1. **Backend**
   ```bash
   heroku create your-app-name
   heroku config:set DB_NAME=your_db_name
   heroku config:set JWT_SECRET=your_secret
   git push heroku main
   ```

2. **Frontend** (static)
   - Deploy to Vercel, Netlify, or similar
   - Update `API_BASE_URL` to production backend URL

## 📝 Environment Variables

```env
# Database
DB_USER=postgres
DB_PASSWORD=password123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hu_book_exchange

# JWT
JWT_SECRET=secure_random_string_change_in_production

# Email (Optional - for real verification)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `psql -U postgres`
- Verify .env configuration
- Check port 5000 is available

### Can't connect to backend
- Ensure backend is running on http://localhost:5000
- Check CORS is enabled
- Verify API_BASE_URL in app.js matches server

### Database errors
- Ensure database exists: `CREATE DATABASE hu_book_exchange;`
- Check user permissions
- Review console for specific errors

### Registration verification fails
- Check browser console (F12) for the verification code
- Code expires after 15 minutes
- Try registering again if code expires

## 📞 Support

For issues, check:
1. Browser console (F12) for errors
2. Terminal output from backend
3. Database connection status
4. Environment variables

## 📄 License

MIT License - Open source project for Hebron University

---

**Made for Hebron University Students** 📚
