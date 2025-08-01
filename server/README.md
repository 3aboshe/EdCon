# EdCon Backend API

This is the backend API for the EdCon application, built with Express.js and MongoDB.

## Setup Instructions

### 1. Install MongoDB

**Option A: Local MongoDB**
- Download and install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
- Start MongoDB service

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Create a new cluster
- Get your connection string

### 2. Install Dependencies

```bash
cd server
npm install
```

### 3. Environment Setup

Create a `.env` file in the server directory:

```env
MONGODB_URI=mongodb://localhost:27017/edcon
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

For MongoDB Atlas, use your connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edcon
```

### 4. Seed the Database

```bash
node seed.js
```

This will create initial users and grades data.

### 5. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with user code
- `GET /api/auth/users` - Get all users (admin only)

### Grades
- `GET /api/grades/student/:studentId` - Get grades for a student
- `POST /api/grades` - Add a new grade
- `PUT /api/grades/:id` - Update a grade
- `DELETE /api/grades/:id` - Delete a grade

### Health Check
- `GET /api/health` - Check if API is running

## Test Users

After seeding, you can login with these codes:
- `student1` - Student account
- `student2` - Another student account
- `teacher1` - Teacher account
- `parent1` - Parent account
- `admin1` - Admin account

## Connecting Frontend

The frontend is already configured to connect to this backend via the `services/apiService.ts` file. Make sure both frontend and backend are running:

1. Backend: `cd server && npm run dev` (port 5000)
2. Frontend: `npm run dev` (port 5173) 