# EdCon Deployment Guide

## Overview
EdCon is a full-stack application with:
- **Frontend**: React + Vite + TypeScript (deployed on Vercel)
- **Backend**: Node.js + Express + MongoDB (deployed on Railway)

## Quick Fix for Current Issues

### 1. Railway Backend Issues (502 Errors)

**Problem**: Your Railway deployment is failing with 502 errors.

**Solution**:
1. Check Railway environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `NODE_ENV` - Set to `production`

2. Update Railway deployment:
   ```bash
   cd server
   railway up
   ```

3. Check Railway logs for specific errors:
   ```bash
   railway logs
   ```

### 2. Frontend CSS Issues

**Problem**: CSS not loading in production.

**Solution**: 
1. The Tailwind directives have been added to `src/index.css`
2. Rebuild and redeploy:
   ```bash
   npm run build
   vercel --prod
   ```

## Step-by-Step Deployment

### Backend Deployment (Railway)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Deploy to Railway**:
   ```bash
   cd server
   railway up
   ```

4. **Set Environment Variables** in Railway Dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: Your Vercel frontend URL (optional)

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - `VITE_API_URL`: `https://your-railway-url.railway.app/api`
   - `VITE_GEMINI_API_KEY`: Your Gemini API key

## Environment Variables

### Backend (Railway)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edcon
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Frontend (Vercel)
```env
VITE_API_URL=https://your-railway-url.railway.app/api
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Troubleshooting

### Railway Issues
1. **502 Bad Gateway**: Check MongoDB connection and environment variables
2. **Build Failures**: Ensure all dependencies are in `package.json`
3. **CORS Errors**: Verify CORS configuration in `server.js`

### Vercel Issues
1. **CSS Not Loading**: Ensure Tailwind directives are in `src/index.css`
2. **API Errors**: Check `VITE_API_URL` environment variable
3. **Build Failures**: Check for TypeScript errors

### Database Issues
1. **Connection Failures**: Verify MongoDB URI format
2. **Authentication**: Check username/password in connection string
3. **Network Access**: Ensure IP whitelist includes Railway IPs

## Health Checks

Test your deployment with these endpoints:

### Backend Health Checks
- `https://your-railway-url.railway.app/api/health`
- `https://your-railway-url.railway.app/api/debug`
- `https://your-railway-url.railway.app/api/test-db`

### Frontend Health Checks
- Visit your Vercel URL
- Check browser console for errors
- Verify API calls are working

## Recent Fixes Applied

1. ✅ **Added Tailwind directives** to `src/index.css`
2. ✅ **Updated CORS configuration** in `server/server.js`
3. ✅ **Fixed API URL handling** in `services/apiService.ts`
4. ✅ **Updated Vercel configuration** in `vercel.json`
5. ✅ **Improved Railway configuration** in `railway.json`

## Support

If you're still experiencing issues:
1. Check Railway logs: `railway logs`
2. Check Vercel logs in the dashboard
3. Verify all environment variables are set correctly
4. Test API endpoints individually 