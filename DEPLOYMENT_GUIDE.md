# 🚀 Deployment Guide

Deploy your Store Rating Platform to the cloud with Vercel (Frontend) and Render (Backend + Database).

## 📋 Overview

- **Frontend**: Vercel (React app)
- **Backend**: Render (Express API)
- **Database**: Render PostgreSQL

---

## 🗄️ Step 1: Deploy Database (Render PostgreSQL)

### 1.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Connect your GitHub account

### 1.2 Create PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Fill in details:
   - **Name**: `store-rating-db`
   - **Database**: `store_rating_db`
   - **User**: `store_user`
   - **Region**: Choose closest to you
   - **PostgreSQL Version**: 15 (latest)
   - **Plan**: Free tier
3. Click **"Create Database"**
4. **Wait 2-3 minutes** for database to be ready
5. **Copy the External Database URL** (starts with `postgresql://`)

---

## 🖥️ Step 2: Deploy Backend (Render Web Service)

### 2.1 Prepare Backend for Deployment

First, update your server package.json:

```bash
cd server
```

Add these scripts to `server/package.json`:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "build": "npx prisma generate && npx prisma migrate deploy",
    "dev": "nodemon src/server.js"
  }
}
```

### 2.2 Create Render Web Service
1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `store-rating-platform`
3. Fill in details:
   - **Name**: `store-rating-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free tier

### 2.3 Add Environment Variables
In the **Environment** section, add:

```
DATABASE_URL=<paste-your-database-url-here>
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
JWT_EXPIRATION=24h
NODE_ENV=production
PORT=10000
```

**Important**: Replace `<paste-your-database-url-here>` with the External Database URL from Step 1.2

### 2.4 Deploy Backend
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Your API will be available at: `https://store-rating-api.onrender.com`

### 2.5 Seed Database (Optional)
Once deployed, you can seed data:
1. Go to your service dashboard
2. Click **"Shell"** tab
3. Run: `node seed-test-data.js`

---

## 🌐 Step 3: Deploy Frontend (Vercel)

### 3.1 Prepare Frontend for Deployment

Update `client/.env.example`:
```env
REACT_APP_API_URL=https://your-api-url.onrender.com/api
```

Create `client/.env.production`:
```env
REACT_APP_API_URL=https://store-rating-api.onrender.com/api
```

### 3.2 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Connect your GitHub account

### 3.3 Deploy to Vercel
1. Click **"New Project"**
2. Import your repository: `store-rating-platform`
3. Configure project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

### 3.4 Add Environment Variables
In **Environment Variables** section:
```
REACT_APP_API_URL=https://store-rating-api.onrender.com/api
```

### 3.5 Deploy Frontend
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your app will be live at: `https://your-app-name.vercel.app`

---

## ⚙️ Step 4: Configure CORS (Backend)

Update your backend to allow your Vercel domain:

In `server/src/server.js`, update CORS configuration:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app-name.vercel.app' // Add your Vercel URL
  ],
  credentials: true
}));
```

Commit and push this change - Render will auto-deploy.

---

## 🧪 Step 5: Test Deployment

### 5.1 Test API
Visit: `https://store-rating-api.onrender.com/api/health`
Should return: `{"status": "OK"}`

### 5.2 Test Frontend
1. Visit your Vercel URL
2. Test registration/login
3. Test all user roles
4. Verify database connectivity

---

## 📝 Step 6: Update README with Live URLs

Add this section to your README.md:

```markdown
## 🌐 Live Demo

- **Frontend**: https://your-app-name.vercel.app
- **API**: https://store-rating-api.onrender.com/api

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | Admin@123 |
| Store Owner | owner@test.com | Owner@123 |
| Normal User | alice@test.com | User@123 |
```

---

## 🔧 Troubleshooting

### Backend Issues
- **Build fails**: Check `package.json` scripts
- **Database connection**: Verify DATABASE_URL
- **CORS errors**: Update allowed origins

### Frontend Issues
- **API calls fail**: Check REACT_APP_API_URL
- **Build fails**: Ensure all dependencies in package.json
- **Routing issues**: Add `_redirects` file in `client/public/`:
  ```
  /*    /index.html   200
  ```

### Database Issues
- **Migrations fail**: Run manually in Render shell
- **Connection timeout**: Database might be sleeping (free tier)

---

## 💰 Cost Breakdown

### Free Tier Limits:
- **Render PostgreSQL**: 1GB storage, 1 month retention
- **Render Web Service**: 750 hours/month
- **Vercel**: 100GB bandwidth, unlimited projects

### Upgrade Options:
- **Render Pro**: $7/month (persistent database)
- **Vercel Pro**: $20/month (more bandwidth)

---

## 🚀 Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Database connected and seeded
- [ ] Frontend deployed and accessible
- [ ] CORS configured correctly
- [ ] All user roles working
- [ ] Environment variables set
- [ ] README updated with live URLs
- [ ] Test all functionality end-to-end

---

## 📞 Support

If you encounter issues:
1. Check Render/Vercel logs
2. Verify environment variables
3. Test API endpoints directly
4. Check CORS configuration

---

**🎉 Once deployed, your project will be live and accessible to recruiters worldwide!**