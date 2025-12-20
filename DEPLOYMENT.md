# 🚀 DHDC E-Resource - Production Deployment Guide

This guide will help you deploy your DHDC E-Resource application to production.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

Before deploying, ensure you have the following environment variables configured:

#### Required Variables:
- ✅ `MONGODB_URI` - Your MongoDB Atlas connection string
- ✅ `JWT_SECRET` - A secure random string (generate using the command below)
- ✅ `NODE_ENV` - Set to `production`

#### Optional Variables:
- `IFRAME_API_KEY` - Your Iframely API key
- `IFRAME_END_POINT` - Iframely endpoint URL
- `FRONTEND_URL` - Your frontend URL for CORS (e.g., https://yourdomain.com)
- `PING_MESSAGE` - Custom health check message

#### Generate a Secure JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Database Setup

1. **MongoDB Atlas**:
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Whitelist your deployment platform's IP addresses (or use 0.0.0.0/0 for all IPs)
   - Create a database user with read/write permissions
   - Get your connection string from the "Connect" button

2. **Update Connection String**:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

### 3. Security Checklist

- ✅ JWT_SECRET is set to a strong, random value
- ✅ MongoDB credentials are secure
- ✅ CORS is configured for your production domain
- ✅ Environment variables are not committed to Git
- ✅ API keys are stored securely

---

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

Netlify is pre-configured in this project and offers:
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Serverless functions support
- ✅ Easy deployment from Git

#### Steps:

1. **Install Netlify CLI** (optional):
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the Project**:
   ```bash
   npm run build
   ```

3. **Deploy via Netlify Dashboard**:
   - Go to [Netlify](https://www.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository
   - Configure build settings:
     - **Build command**: `npm run build:client`
     - **Publish directory**: `dist/spa`
     - **Functions directory**: `netlify/functions`

4. **Set Environment Variables**:
   - Go to Site settings → Environment variables
   - Add all required variables from the checklist above

5. **Deploy**:
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site

#### Deploy via CLI:
```bash
netlify login
netlify init
netlify deploy --prod
```

---

### Option 2: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Create `vercel.json`** (if not exists):
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/server/node-build.mjs",
         "use": "@vercel/node"
       },
       {
         "src": "dist/spa/**",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "dist/server/node-build.mjs"
       },
       {
         "src": "/(.*)",
         "dest": "dist/spa/$1"
       }
     ]
   }
   ```

3. **Deploy**:
   ```bash
   npm run build
   vercel --prod
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add NODE_ENV
   ```

---

### Option 3: Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**:
   ```bash
   railway login
   railway init
   ```

3. **Add Environment Variables**:
   ```bash
   railway variables set MONGODB_URI="your-mongodb-uri"
   railway variables set JWT_SECRET="your-jwt-secret"
   railway variables set NODE_ENV="production"
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

---

### Option 4: Heroku

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**:
   ```bash
   heroku login
   heroku create dhdc-resource
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set MONGODB_URI="your-mongodb-uri"
   heroku config:set JWT_SECRET="your-jwt-secret"
   heroku config:set NODE_ENV="production"
   ```

4. **Add Procfile**:
   ```
   web: npm run start
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

---

### Option 5: DigitalOcean App Platform

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App" → Connect your repository
3. Configure:
   - **Build Command**: `npm run build`
   - **Run Command**: `npm run start`
4. Add environment variables in the dashboard
5. Deploy

---

### Option 6: Self-Hosted (VPS/Docker)

#### Using Node.js directly:

1. **SSH into your server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone your repository**:
   ```bash
   git clone https://github.com/yourusername/dhdc-resource.git
   cd dhdc-resource
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Create `.env` file** with production values

5. **Build the application**:
   ```bash
   npm run build
   ```

6. **Install PM2** (process manager):
   ```bash
   npm install -g pm2
   ```

7. **Start the application**:
   ```bash
   pm2 start dist/server/node-build.mjs --name dhdc-resource
   pm2 save
   pm2 startup
   ```

8. **Setup Nginx as reverse proxy**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **Setup SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 🔍 Post-Deployment Verification

### 1. Health Check
Test your API endpoint:
```bash
curl https://your-domain.com/api/ping
```

Expected response:
```json
{"message":"pong"}
```

### 2. Test Authentication
- Try registering a new admin user
- Try logging in as a student
- Verify JWT tokens are working

### 3. Test Resources
- Create a new resource (admin only)
- View resources on student dashboard
- Test embed functionality

### 4. Monitor Logs
Check your deployment platform's logs for any errors:
- **Netlify**: Functions tab → View logs
- **Vercel**: Deployments → View function logs
- **Railway**: Deployments → View logs
- **Heroku**: `heroku logs --tail`

---

## 🛠️ Troubleshooting

### "JWT_SECRET not set" Error
- Ensure `JWT_SECRET` is set in your environment variables
- Restart your deployment after adding the variable

### Database Connection Failed
- Check your MongoDB Atlas IP whitelist
- Verify your connection string is correct
- Ensure database user has proper permissions

### CORS Errors
- Set `FRONTEND_URL` environment variable to your frontend domain
- Check that CORS is configured correctly in `server/index.ts`

### 404 on API Routes
- Verify your deployment platform is routing `/api/*` to the serverless function
- Check `netlify.toml` or equivalent configuration file

---

## 📊 Monitoring & Maintenance

### Recommended Tools:
- **Uptime Monitoring**: [UptimeRobot](https://uptimerobot.com/) (free)
- **Error Tracking**: [Sentry](https://sentry.io/) (free tier)
- **Analytics**: [Google Analytics](https://analytics.google.com/)
- **Database Monitoring**: MongoDB Atlas built-in monitoring

### Regular Maintenance:
- Monitor database size and performance
- Review error logs weekly
- Update dependencies monthly: `npm update`
- Backup your database regularly
- Rotate JWT_SECRET periodically (requires all users to re-login)

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong passwords** for MongoDB and admin accounts
3. **Rotate secrets regularly** - Change JWT_SECRET every 3-6 months
4. **Monitor for suspicious activity** - Check logs for failed login attempts
5. **Keep dependencies updated** - Run `npm audit` regularly
6. **Use HTTPS only** - All deployment platforms provide free SSL
7. **Implement rate limiting** - Consider adding rate limiting for auth endpoints
8. **Backup your data** - Regular MongoDB backups are essential

---

## 📞 Support

If you encounter issues during deployment:
1. Check the troubleshooting section above
2. Review your platform's documentation
3. Check application logs for specific error messages
4. Verify all environment variables are set correctly

---

## 🎉 Success!

Once deployed, your DHDC E-Resource platform will be accessible at your chosen domain. Students can log in using their admission numbers, and admins can manage resources through the admin dashboard.

**Default Admin Setup**: You'll need to register the first admin user through the `/register` page with `role: "admin"`.

**Student Login**: Students use their admission number and name from `server/data.json`.

---

## 📝 Quick Reference

### Build Commands:
```bash
npm run build          # Build both client and server
npm run build:client   # Build client only
npm run build:server   # Build server only
```

### Start Commands:
```bash
npm run dev    # Development mode
npm run start  # Production mode (after build)
```

### Environment Variables Template:
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dhdc
JWT_SECRET=your-secure-random-string-here
IFRAME_API_KEY=your-iframely-key
IFRAME_END_POINT=https://iframe.ly/api/iframely?url={encoded_url}&api_key=your-key
FRONTEND_URL=https://yourdomain.com
```

---

**Good luck with your deployment! 🚀**
