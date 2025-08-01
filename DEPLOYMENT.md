# 🚀 EdCon Deployment Guide

## Free Hosting Options

### **Option 1: Vercel + Railway (Recommended)**

#### **Backend Deployment (Railway)**

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Clone your repository
   git clone <your-repo-url>
   cd edcon-app/server
   
   # Install dependencies
   npm install
   
   # Create Railway project
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables in Railway**
   - Go to your Railway project dashboard
   - Add these environment variables:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   PORT=5005
   NODE_ENV=production
   ```

4. **Get Your Backend URL**
   - Railway will give you a URL like: `https://your-app-name.railway.app`
   - Note this URL for the frontend configuration

#### **Frontend Deployment (Vercel)**

1. **Sign up for Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from project root
   cd edcon-app
   vercel
   ```

3. **Configure Environment Variables**
   - In Vercel dashboard, add:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

4. **Update vercel.json**
   - Replace `your-backend-url.railway.app` with your actual Railway URL

### **Option 2: Render (Alternative)**

#### **Backend on Render**

1. **Sign up for Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Connect your GitHub repository
   - Set build command: `cd server && npm install`
   - Set start command: `cd server && npm start`
   - Add environment variables:
     ```
     MONGODB_URI=your_mongodb_atlas_connection_string
     PORT=5005
     NODE_ENV=production
     ```

#### **Frontend on Render**

1. **Create Static Site**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com/api
     ```

### **Option 3: Netlify (Frontend Alternative)**

1. **Sign up for Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub

2. **Deploy**
   - Connect your repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend-url.railway.app/api
     ```

## **Database Setup (MongoDB Atlas)**

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for free tier

2. **Create Cluster**
   - Choose free tier (M0)
   - Select your preferred region

3. **Get Connection String**
   - Go to "Connect" in your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

4. **Add to Environment Variables**
   - Add the connection string to your backend environment variables

## **Environment Variables Reference**

### **Backend (Railway/Render)**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edcon?retryWrites=true&w=majority
PORT=5005
NODE_ENV=production
```

### **Frontend (Vercel/Netlify)**
```
VITE_API_URL=https://your-backend-url.railway.app/api
```

## **Deployment Checklist**

- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Environment variables configured
- [ ] Database connected and seeded
- [ ] CORS configured properly
- [ ] API endpoints working
- [ ] Frontend can communicate with backend

## **Troubleshooting**

### **Common Issues**

1. **CORS Errors**
   - Add your frontend URL to CORS configuration in server.js

2. **Environment Variables Not Working**
   - Check variable names (case sensitive)
   - Restart deployment after adding variables

3. **Database Connection Issues**
   - Verify MongoDB Atlas IP whitelist
   - Check connection string format

4. **Build Errors**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

## **Cost Breakdown**

- **Vercel**: Free tier (generous)
- **Railway**: $5/month credit (usually enough for small apps)
- **MongoDB Atlas**: Free tier (512MB)
- **Total**: ~$5/month or free with alternatives

## **Performance Tips**

1. **Enable Caching** in Vercel/Netlify
2. **Use CDN** for static assets
3. **Optimize Images** and bundle size
4. **Monitor Usage** to stay within free tiers 