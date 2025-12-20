# DHDC Resource Sharing Platform - Setup Guide

## Project Overview

DHDC is a production-ready web platform for sharing e-books, audiobooks, and essential learning resources through external links. It features:

- **Student Access**: Browse and filter resources by class, category, and type
- **Admin Management**: Add, edit, and delete learning resources
- **JWT Authentication**: Secure login with role-based access control
- **MongoDB Database**: Scalable storage for users and resources
- **Beautiful UI**: Modern, responsive design built with React, TailwindCSS, and Radix UI

---

## Prerequisites

- **Node.js** 18+ (or use pnpm)
- **pnpm** package manager (configured in package.json)
- **MongoDB Atlas** account (free tier available)

---

## Step 1: Set Up MongoDB Atlas

### Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project (e.g., "DHDC")

### Create a Database Cluster

1. Click "Create Deployment"
2. Choose **M0 (Free)** tier
3. Select your preferred region
4. Name it "dhdc-cluster"
5. Wait for the cluster to be created (~5-10 minutes)

### Get Your Connection String

1. Click "Connect" on your cluster
2. Choose "Drivers" → "Node.js"
3. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/...`)
4. Replace `<password>` with your actual password

---

## Step 2: Configure Environment Variables

### Create `.env` file in project root

```bash
# Copy the example file
cp .env.example .env
```

### Edit `.env` with your values

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dhdc?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-change-in-production
PING_MESSAGE=pong
```

⚠️ **Important**: Change `JWT_SECRET` to a strong random string in production!

---

## Step 3: Install Dependencies

```bash
pnpm install
```

---

## Step 4: Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:8080`

---

## Step 5: Test the Application

### Test Registration

1. Go to `/register`
2. Create a new student account
3. You should be redirected to `/student/dashboard`

### Test Login

1. Go to `/login`
2. Sign in with your credentials
3. Access the student dashboard with resource browsing

### Create Admin Account (via Database)

For testing, you can manually create an admin in MongoDB:

1. Go to MongoDB Atlas → Collections
2. Find the `users` collection
3. Insert a new document:

```json
{
  "name": "Admin User",
  "email": "admin@dhdc.com",
  "passwordHash": "[bcrypt hash of your password]",
  "role": "admin",
  "createdAt": new Date()
}
```

Or use a bcrypt tool to generate the hash for your password.

### Test Admin Dashboard

1. Login with admin credentials
2. Access `/admin/dashboard`
3. Add, edit, and delete resources

---

## Available Routes

### Public Routes

- `/` - Homepage
- `/login` - Login page
- `/register` - Registration page

### Student Routes

- `/student/dashboard` - Browse and filter resources

### Admin Routes

- `/admin/dashboard` - Manage resources (add/edit/delete)

---

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Resources

- `GET /api/resources` - Get resources (with optional filters)
- `POST /api/resources` - Create resource (admin only)
- `PUT /api/resources/:id` - Update resource (admin only)
- `DELETE /api/resources/:id` - Delete resource (admin only)

### Query Parameters for `/api/resources`

- `class` - Filter by class (8-12)
- `category` - Filter by category
- `type` - Filter by resource type
- `search` - Search by title

---

## Production Deployment

### Deploy to Netlify

1. **Connect your GitHub repository** to Netlify
2. **Set environment variables** in Netlify:
   - Go to Site Settings → Environment
   - Add `MONGODB_URI` and `JWT_SECRET`
3. **Build settings**:
   - Build command: `pnpm build`
   - Publish directory: `dist/spa`
4. **Deploy**

### Deploy to Vercel

1. Import project from GitHub
2. Add environment variables
3. Set build command to `pnpm build`
4. Deploy

---

## File Structure

```
├── client/
│   ├── pages/
│   │   ├── Index.tsx           # Homepage
│   │   ├── Login.tsx           # Login page
│   │   ├── Register.tsx        # Registration page
│   │   ├── StudentDashboard.tsx # Student resource browser
│   │   ├── AdminDashboard.tsx  # Admin resource manager
│   │   └── NotFound.tsx        # 404 page
│   ├── components/
│   │   ├── ui/                 # Radix UI components
│   │   └── Navigation.tsx      # Header navigation
│   ├── lib/
│   │   ├── auth.ts             # Auth hooks and utilities
│   │   └── utils.ts            # General utilities
│   ├── global.css              # Theme and global styles
│   └── App.tsx                 # Router setup
│
├── server/
│   ├── models/
│   │   ├── User.ts             # User schema
│   │   └── Resource.ts         # Resource schema
│   ├── routes/
│   │   ├── auth.ts             # Auth endpoints
│   │   └── resources.ts        # Resource endpoints
│   ├── lib/
│   │   └── auth.ts             # Auth middleware
│   ├── db.ts                   # MongoDB connection
│   └── index.ts                # Express server setup
│
├── shared/
│   └── api.ts                  # Shared API types
│
└── tailwind.config.ts          # TailwindCSS configuration
```

---

## Troubleshooting

### "Cannot connect to MongoDB"

- Check your MONGODB_URI is correct
- Ensure IP address is whitelisted in MongoDB Atlas (or use 0.0.0.0/0)
- Verify network connectivity

### "JWT_SECRET not set"

- Create a `.env` file with JWT_SECRET
- Restart the dev server

### "Port 8080 already in use"

- Kill the existing process or use a different port

### "Dependencies not installed"

- Run `pnpm install --no-frozen-lockfile`
- Clear pnpm cache: `pnpm store prune`

---

## Next Steps

1. **Customize Resources**:
   - Add more classes, categories, or types in `StudentDashboard.tsx` and `AdminDashboard.tsx`

2. **Add Features**:
   - User profile page
   - Resource recommendations
   - Resource download tracking
   - Email notifications for new resources

3. **Security Enhancements**:
   - Add rate limiting
   - Implement CSRF protection
   - Add input validation and sanitization
   - Use HTTPS only in production

4. **Performance**:
   - Add caching with Redis
   - Implement pagination for resources
   - Optimize database queries with indexes

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the MongoDB Atlas documentation
3. Check Express.js and React Router documentation
4. Open an issue on GitHub

---

## License

This project is production-ready and can be used as a template for building educational resource sharing platforms.
