#!/bin/bash

echo "🚀 EdCon Redeployment Script"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Building frontend...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 2: Deploying backend to Railway...${NC}"
cd server
railway up

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend deployment successful${NC}"
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    echo -e "${YELLOW}Check Railway logs: railway logs${NC}"
fi

cd ..

echo -e "${YELLOW}Step 3: Deploying frontend to Vercel...${NC}"
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployment successful${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Redeployment complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Check Railway dashboard for backend URL"
echo "2. Check Vercel dashboard for frontend URL"
echo "3. Verify environment variables are set correctly"
echo "4. Test the application endpoints"
echo ""
echo -e "${YELLOW}Health check URLs:${NC}"
echo "- Backend health: https://your-railway-url.railway.app/api/health"
echo "- Backend debug: https://your-railway-url.railway.app/api/debug"
echo "- Database test: https://your-railway-url.railway.app/api/test-db" 