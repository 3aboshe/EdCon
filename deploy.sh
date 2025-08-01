#!/bin/bash

echo "🚀 Starting EdCon deployment..."

# Build the frontend
echo "📦 Building frontend..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Copy built files to server/public if needed
echo "📁 Copying built files..."
mkdir -p server/public
cp -r dist/* server/public/

echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Deploy backend to Railway: cd server && railway up"
echo "2. Deploy frontend to Vercel: vercel --prod"
echo "3. Set environment variables in Railway dashboard"
echo "   - MONGODB_URI"
echo "   - NODE_ENV=production"
echo "4. Set environment variables in Vercel dashboard"
echo "   - VITE_API_URL=https://your-railway-url.railway.app/api"
echo "   - VITE_GEMINI_API_KEY" 