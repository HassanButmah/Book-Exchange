# 🚀 HU Book Exchange - Quick Reference Card

## ⚡ Start Application

### Terminal 1: Backend
```bash
cd server
npm install
npm start
```
Expected: Server running on http://localhost:5000

### Terminal 2: Frontend
```bash
cd frontend
python -m http.server 3000
```
Expected: Server running on http://localhost:3000

### Browser
```
http://localhost:3000
```

---

## 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | demo@students.hebron.edu | password123 |
| Admin | admin@students.hebron.edu | admin123 |

**Note:** Check browser console (F12) for OTP code during registration

---

## 🔧 Important Files

### Backend
- `server/index.js` - Express server
- `server/db.js` - Database setup
- `server/seed.js` - Demo data
- `.env` - Configuration

### Frontend
- `frontend/app.js` - Main logic & API calls
- `frontend/style.css` - Styles
- `frontend/marketplace.html` - Browse books
- `frontend/add-book.html` - Create listings

---

## 📍 Key Endpoints

```
GET    http://localhost:5000/api/health
POST   http://localhost:5000/api/auth/register
POST   http://localhost:5000/api/auth/verify
POST   http://localhost:5000/api/auth/login
GET    http://localhost:5000/api/books
GET    http://localhost:5000/api/books/search?q=title
GET    http://localhost:5000/api/books/user/my-books
POST   http://localhost:5000/api/books
DELETE http://localhost:5000/api/books/:id
```

---

## 🔑 API Key in Headers

```javascript
// Add to all authenticated requests
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 📊 Database Commands

```bash
# Connect to database
psql -U postgres -d hu_book_exchange

# List tables
\dt

# View users
SELECT id, name, email, is_verified FROM users;

# View books
SELECT b.*, u.name FROM books b JOIN users u ON b.owner_id = u.id;

# Count books
SELECT COUNT(*) FROM books;

# Delete all books (testing)
DELETE FROM books;

# Reset auto-increment
ALTER SEQUENCE books_id_seq RESTART WITH 1;

# Exit
\q
```

---

## 🐛 Debugging

### Browser Console (F12)
- Check for JavaScript errors
- Find verification codes during registration
- Monitor API calls

### Backend Logs
- Server startup messages
- Request logs
- Error messages

### Database Logs
```bash
tail -f /var/log/postgresql/postgresql.log  # Mac/Linux
# Windows: Check Event Viewer
```

---

## 🔄 Workflow

### Register New User
1. Click Register
2. Fill form with @students.hebron.edu email
3. Check console (F12) for 6-digit code
4. Paste code to verify
5. Redirected to login

### Add Book
1. Login
2. Click "Add Book"
3. Fill book details
4. Submit
5. View in "My Books"

### Search Books
1. Go to Marketplace
2. Type in search box
3. Select condition filter
4. Select price range
5. Results update live

---

## ✅ Health Checks

```bash
# Backend running?
curl http://localhost:5000/api/health

# Database connected?
psql -U postgres -d hu_book_exchange -c "SELECT 1"

# Port 5000 available?
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000
```

---

## 🔧 .env Configuration

```env
DB_USER=postgres
DB_PASSWORD=password123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hu_book_exchange
JWT_SECRET=super_secret_key_change_in_prod
PORT=5000
NODE_ENV=development
```

---

## 📦 Dependencies

### Backend
```json
{
  "express": "^4.18.2",
  "pg": "^8.11.3",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.1.2",
  "nodemailer": "^6.9.7",
  "cors": "^2.8.5",
  "body-parser": "^1.20.2"
}
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Port 5000 in use | Change PORT in .env |
| DB connection failed | Check PostgreSQL running |
| Module not found | Run `npm install` |
| CORS error | Check backend CORS enabled |
| Login fails | Check email verified & .env correct |
| No results in search | Try simpler search term |
| Image not loading | Use valid image URL |

---

## 📱 Testing Features

- [ ] Register with new email
- [ ] Verify with OTP code
- [ ] Login with credentials
- [ ] View marketplace
- [ ] Search books
- [ ] Filter by condition
- [ ] Filter by price
- [ ] Add new book
- [ ] View my books
- [ ] Delete book
- [ ] Logout
- [ ] Mobile responsive

---

## 🎯 Frontend API Integration

```javascript
// Get all books
fetch('http://localhost:5000/api/books')

// Search books
fetch('http://localhost:5000/api/books/search?q=data+structures&condition=Used')

// Add book (authenticated)
fetch('http://localhost:5000/api/books', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Book Title',
    description: 'Description',
    price: 50,
    condition: 'New',
    image_url: 'https://...'
  })
})

// Delete book (authenticated)
fetch('http://localhost:5000/api/books/123', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
```

---

## 📈 Performance Tips

- [ ] Images: Use direct URLs, not uploads
- [ ] Database: Add indexes on frequently queried fields
- [ ] API: Implement pagination for large datasets
- [ ] Frontend: Lazy load images below fold
- [ ] Caching: Cache search results client-side

---

## 🚀 Next Steps

1. ✅ Setup PostgreSQL
2. ✅ Install dependencies
3. ✅ Start backend
4. ✅ Start frontend
5. ✅ Test with demo accounts
6. ✅ Register new account
7. ✅ Add books
8. ✅ Search & filter
9. ✅ Deploy to production

---

## 📞 Quick Help

```bash
# Restart backend
^C  # Press Ctrl+C to stop
npm start  # Restart

# Reset database
psql -U postgres -d hu_book_exchange
DROP TABLE books CASCADE;
DROP TABLE verification_codes CASCADE;
DROP TABLE users CASCADE;
\q
npm start  # Restart backend (recreates tables)

# Clear browser cache
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete
# Safari: Cmd+Option+E
```

---

## 🎓 Code Examples

### Login Flow
```javascript
// 1. Send credentials
const response = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// 2. Store token
const { token } = await response.json();
localStorage.setItem('token', token);

// 3. Use token for future requests
const res = await fetch(`${API}/books`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

**Bookmark this for quick reference!** 📌

Last Updated: June 2026
