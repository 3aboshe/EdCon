#!/bin/bash

echo "🚀 EdCon Deployment Script"
echo "=========================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if all files are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    echo "   git add ."
    echo "   git commit -m 'Prepare for deployment'"
    exit 1
fi

echo "✅ Repository is ready for deployment"
echo ""
echo "📋 Next Steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy Backend (Railway):"
echo "   - Go to railway.app"
echo "   - Connect your GitHub repo"
echo "   - Set environment variables"
echo "3. Deploy Frontend (Vercel):"
echo "   - Go to vercel.com"
echo "   - Connect your GitHub repo"
echo "   - Set VITE_API_URL environment variable"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions" 