# 🚀 HU Book Exchange - Deployment Guide

Complete guide to deploying HU Book Exchange to production.

---

## 📋 Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] No hardcoded localhost URLs
- [ ] Environment variables configured
- [ ] Database backup taken
- [ ] Security review completed
- [ ] HTTPS certificates ready
- [ ] Email service configured
- [ ] Domain name ready
- [ ] SSL certificate obtained
- [ ] CDN configured (optional)

---

## 🌐 Deployment Options

### Option 1: Heroku (Easiest - Recommended)

#### Backend Deployment

1. **Install Heroku CLI**
   ```bash
   # Windows: Download from https://devcenter.heroku.com/articles/heroku-cli
   # Mac: brew install heroku/brew/heroku
   # Linux: apt-get install heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   cd server
   heroku create your-app-name
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set JWT_SECRET=your_very_secure_random_key_here
   heroku config:set NODE_ENV=production
   heroku config:set EMAIL_USER=your_email@gmail.com
   heroku config:set EMAIL_PASSWORD=your_app_password
   ```

5. **Add PostgreSQL Database**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

6. **Update Backend Code**
   - Remove `console.log()` statements
   - Add proper error handling
   - Update CORS origins:
   ```javascript
   app.use(cors({
       origin: process.env.FRONTEND_URL || 'http://localhost:3000'
   }));
   ```

7. **Deploy**
   ```bash
   git push heroku main
   # Or: git push heroku branch_name:main
   ```

8. **Verify Deployment**
   ```bash
   heroku open
   # Visit: https://your-app-name.herokuapp.com/api/health
   ```

9. **View Logs**
   ```bash
   heroku logs --tail
   ```

#### Frontend Deployment

1. **Update API_BASE_URL in `frontend/app.js`**
   ```javascript
   const API_BASE_URL = 'https://your-app-name.herokuapp.com/api';
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repo
   - Set build command: `echo "No build needed"`
   - Set output directory: `frontend`
   - Click Deploy

3. **Custom Domain (Optional)**
   - Add domain in Vercel dashboard
   - Update DNS records

---

### Option 2: AWS (Scalable)

#### Backend on EC2

1. **Launch EC2 Instance**
   - Choose Ubuntu LTS
   - Security group: Allow 5000, 443, 22
   - Create key pair

2. **SSH into Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Node and PostgreSQL**
   ```bash
   sudo apt update
   sudo apt install nodejs npm postgresql postgresql-contrib
   ```

4. **Clone Repository**
   ```bash
   git clone your-repo-url
   cd HU-Book-Exchange/server
   npm install
   ```

5. **Configure Environment**
   ```bash
   nano .env
   # Set all environment variables
   ```

6. **Start with PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   pm2 start index.js --name "hu-book-exchange"
   pm2 startup
   pm2 save
   ```

7. **Setup Nginx (Reverse Proxy)**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/default
   ```
   
   Configure:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }
   }
   ```

8. **Enable HTTPS with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

#### Frontend on S3 + CloudFront

1. **Create S3 Bucket**
   - Enable static website hosting
   - Make files public
   - Upload frontend files

2. **Create CloudFront Distribution**
   - Origin: Your S3 bucket
   - Default root object: index.html
   - SSL certificate: Choose ACM certificate

3. **Update API URL**
   ```javascript
   const API_BASE_URL = 'https://your-api-domain.com/api';
   ```

---

### Option 3: DigitalOcean (Affordable)

#### Using DigitalOcean App Platform

1. **Create New App**
   - Connect GitHub repo
   - Specify build command

2. **Configure Build**
   ```yaml
   name: hu-book-exchange
   services:
   - name: backend
     github:
       repo: your-repo
       branch: main
     build_command: cd server && npm install
     run_command: cd server && npm start
     http_port: 5000
   ```

3. **Add Database**
   - Choose PostgreSQL
   - DigitalOcean will create and manage it

4. **Set Environment Variables**
   - Add in DigitalOcean dashboard
   - Reference in `.env`

5. **Deploy**
   - Automatic on push to main branch

---

### Option 4: Railway (Modern & Simple)

1. **Connect GitHub**
   - Go to https://railway.app
   - Connect your GitHub account
   - Select repository

2. **Create New Project**
   - Add PostgreSQL service
   - Add Node.js service

3. **Configure Node Service**
   - Build command: `cd server && npm install`
   - Start command: `cd server && npm start`

4. **Set Environment Variables**
   - Railway provides DATABASE_URL automatically
   - Add JWT_SECRET and other variables

5. **Deploy**
   - Automatic on push

---

## 🔐 Security Checklist for Production

### Backend Security
- [ ] Change JWT_SECRET to strong random string
- [ ] Enable HTTPS only
- [ ] Set secure CORS origins
- [ ] Hide error messages (don't expose stack traces)
- [ ] Rate limit API endpoints
- [ ] Add input validation
- [ ] Update Node.js dependencies
- [ ] Use environment variables for secrets
- [ ] Enable helmet.js for security headers
- [ ] Add request logging

### Database Security
- [ ] Use strong PostgreSQL password
- [ ] Enable SSL connections
- [ ] Regular backups enabled
- [ ] Restrict database access by IP
- [ ] Use read-only replicas for scaling
- [ ] Monitor for suspicious activity

### Frontend Security
- [ ] Remove console.log statements
- [ ] Remove debug tools
- [ ] Enable HTTPS only
- [ ] Add Content Security Policy headers
- [ ] Minify JavaScript and CSS
- [ ] Use secure cookies (httpOnly, Secure, SameSite)

### Application Security
- [ ] Email verification enabled
- [ ] Password requirements enforced
- [ ] Session timeout implemented
- [ ] CSRF protection enabled
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection enabled

---

## 🚀 Deployment Steps Summary

### For Heroku (Quickest)

```bash
# 1. Setup Heroku
heroku login
cd server
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev

# 2. Configure
heroku config:set JWT_SECRET=your_secret_key
heroku config:set EMAIL_USER=your_email@gmail.com
heroku config:set EMAIL_PASSWORD=your_password

# 3. Deploy
git push heroku main

# 4. Check status
heroku logs --tail
heroku open

# 5. Update frontend API_BASE_URL
# In frontend/app.js:
# const API_BASE_URL = 'https://your-app-name.herokuapp.com/api';

# 6. Deploy frontend to Vercel
# - Import from GitHub
# - Set build: echo "No build needed"
# - Set output: frontend
```

---

## 📊 Monitoring & Maintenance

### Monitoring Tools
- **Sentry** - Error tracking
- **LogRocket** - Frontend monitoring
- **DataDog** - Infrastructure monitoring
- **New Relic** - Performance monitoring

### Setup Error Tracking (Sentry Example)

```bash
npm install --save @sentry/node
```

```javascript
// In backend index.js
const Sentry = require("@sentry/node");
Sentry.init({ dsn: "your_sentry_dsn" });
app.use(Sentry.Handlers.errorHandler());
```

### Database Backups
```bash
# Manual backup
pg_dump -U postgres hu_book_exchange > backup.sql

# Restore
psql -U postgres hu_book_exchange < backup.sql

# Heroku: Backups automatic
heroku pg:backups
```

---

## 📈 Scaling Strategy

### Phase 1: Initial Launch
- Single server
- Single database
- CDN for frontend

### Phase 2: Growing Traffic
- Add Redis caching
- Database read replicas
- Load balancer

### Phase 3: High Demand
- Microservices
- Auto-scaling
- Global CDN
- Database sharding

---

## 💰 Cost Estimation (Monthly)

### Minimal Setup (Heroku + Vercel)
- Heroku Dyno: $7/mo
- Heroku PostgreSQL: $9/mo
- Vercel: Free
- Total: ~$16/mo

### Standard Setup (AWS)
- EC2 t3.micro: $8/mo
- RDS PostgreSQL: $15/mo
- Elastic IP: $3/mo
- S3: <$1/mo
- CloudFront: Variable
- Total: $26-50/mo

### Enterprise Setup
- Multiple servers: $200+
- Professional database: $100+
- CDN: $20+
- Monitoring: $50+
- Total: $500+/mo

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Heroku

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "your-app-name"
        heroku_email: "your-email@example.com"
```

---

## 🆘 Deployment Troubleshooting

### Issue: Application crashes on startup
**Solution:**
```bash
# Check logs
heroku logs --tail

# Restart
heroku ps:restart

# Check npm scripts
# package.json start script should be:
# "start": "node index.js"
```

### Issue: Database connection error
**Solution:**
```bash
# Get database URL
heroku config:get DATABASE_URL

# Update db.js to use DATABASE_URL
# Update .env to match
```

### Issue: Frontend can't reach backend
**Solution:**
```javascript
// Make sure API_BASE_URL is correct
const API_BASE_URL = 'https://your-heroku-app.herokuapp.com/api';

// Check CORS in backend
app.use(cors({
    origin: 'https://your-vercel-app.vercel.app'
}));
```

### Issue: 503 Service Unavailable
**Solution:**
- Check Heroku dyno status
- Check database connection
- Review recent code changes
- Check logs for errors

---

## 📋 Post-Deployment

### After Launch
- [ ] Test all features in production
- [ ] Monitor error rates (Sentry)
- [ ] Check response times
- [ ] Verify email service working
- [ ] Test on mobile devices
- [ ] Get user feedback
- [ ] Fix any issues
- [ ] Monitor for 24 hours

### Ongoing Maintenance
- [ ] Weekly: Check logs and errors
- [ ] Weekly: Monitor database size
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review security
- [ ] Monthly: Backup database
- [ ] Quarterly: Performance review
- [ ] Quarterly: Security audit

---

## 🎓 Production Best Practices

1. **Always use HTTPS**
   - SSL/TLS certificates
   - HSTS headers

2. **Environment Variables**
   - Never commit secrets
   - Use `.env` locally
   - Set in platform dashboard

3. **Error Handling**
   - Don't expose stack traces
   - Log errors securely
   - Use error tracking service

4. **Performance**
   - Monitor response times
   - Use CDN for static files
   - Cache database queries
   - Optimize database queries

5. **Security**
   - Regular updates
   - Penetration testing
   - Security headers
   - Rate limiting

6. **Monitoring**
   - Uptime monitoring
   - Error tracking
   - Performance monitoring
   - Database monitoring

---

## 🎉 Congratulations!

Your application is now live and accessible worldwide! 🌍

**Remember:** Always monitor, update, and maintain your application!

---

For more information:
- Check README.md for feature details
- Check ARCHITECTURE.md for system design
- Check QUICK_REFERENCE.md for common commands

Made with ❤️ for Hebron University 📚
