# ✅ Production Readiness Checklist

Use this checklist before deploying to production.

## 🔐 Security

- [ ] **JWT_SECRET** is set to a strong, random value (not the default)
  ```bash
  # Generate a new one:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] **MongoDB credentials** are secure and not using default passwords

- [ ] **Environment variables** are not committed to Git
  - Check `.gitignore` includes `.env`
  - Verify `.env` is not in repository: `git ls-files | grep .env`

- [ ] **CORS** is configured for your production domain
  - Set `FRONTEND_URL` environment variable

- [ ] **API keys** are stored in environment variables, not hardcoded

- [ ] **Security headers** are enabled (already configured in `server/index.ts`)

## 🗄️ Database

- [ ] **MongoDB Atlas** cluster is created

- [ ] **IP whitelist** is configured
  - For serverless: Allow all IPs (0.0.0.0/0)
  - For VPS: Add your server's IP

- [ ] **Database user** has appropriate permissions (readWrite)

- [ ] **Connection string** is correct in `MONGODB_URI`

- [ ] **Database backups** are configured in MongoDB Atlas

## 🌐 Environment Variables

Verify all required variables are set:

- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI` (your MongoDB connection string)
- [ ] `JWT_SECRET` (strong random string)
- [ ] `IFRAME_API_KEY` (if using Iframely)
- [ ] `IFRAME_END_POINT` (if using Iframely)
- [ ] `FRONTEND_URL` (your production domain, optional)

Run the environment check:
```bash
npm run prod:check
```

## 🏗️ Build & Deploy

- [ ] **Build succeeds** without errors
  ```bash
  npm run build
  ```

- [ ] **TypeScript** compiles without errors
  ```bash
  npm run typecheck
  ```

- [ ] **Tests pass** (if you have tests)
  ```bash
  npm test
  ```

- [ ] **Dependencies** are up to date
  ```bash
  npm outdated
  npm audit
  ```

- [ ] **Production build** is tested locally
  ```bash
  npm run build
  npm run start
  # Visit http://localhost:3000
  ```

## 📝 Configuration Files

- [ ] **netlify.toml** is configured (if using Netlify)

- [ ] **package.json** has correct start script

- [ ] **.gitignore** includes:
  - `node_modules/`
  - `.env`
  - `dist/`
  - `.DS_Store`

## 🧪 Testing

- [ ] **API endpoints** are working
  - Test `/api/ping`
  - Test `/api/auth/login`
  - Test `/api/auth/student-login`
  - Test `/api/resources`

- [ ] **Authentication** works
  - Admin login
  - Student login
  - JWT token validation

- [ ] **CORS** is working from your frontend domain

- [ ] **Error handling** is working
  - Test invalid routes (404)
  - Test invalid credentials (401)
  - Test unauthorized access (403)

## 📱 Frontend

- [ ] **Build output** is optimized
  - Check `dist/spa/` folder size
  - Verify assets are minified

- [ ] **Environment variables** are prefixed with `VITE_` for client-side use

- [ ] **API calls** use relative URLs or environment-based URLs

- [ ] **Error boundaries** are in place

- [ ] **Loading states** are implemented

## 🚀 Deployment Platform

### Netlify
- [ ] Build command: `npm run build:client`
- [ ] Publish directory: `dist/spa`
- [ ] Functions directory: `netlify/functions`
- [ ] Environment variables set in dashboard

### Vercel
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist/spa`
- [ ] Environment variables set via CLI or dashboard

### Railway/Heroku
- [ ] Start command: `npm run start`
- [ ] Environment variables set
- [ ] Port is dynamic: `process.env.PORT`

## 📊 Monitoring

- [ ] **Health check endpoint** is accessible
  ```bash
  curl https://your-domain.com/api/ping
  ```

- [ ] **Error logging** is configured
  - Check deployment platform logs

- [ ] **Uptime monitoring** is set up (optional)
  - UptimeRobot, Pingdom, etc.

- [ ] **Performance monitoring** (optional)
  - Sentry, LogRocket, etc.

## 🔍 Post-Deployment

- [ ] **DNS** is configured correctly

- [ ] **SSL/HTTPS** is enabled and working

- [ ] **All pages** load correctly

- [ ] **Student login** works with data from `server/data.json`

- [ ] **Admin login** works

- [ ] **Resource creation** works (admin only)

- [ ] **Resource viewing** works (students)

- [ ] **Mobile responsive** design works

- [ ] **Browser compatibility** tested
  - Chrome
  - Firefox
  - Safari
  - Edge

## 📋 Documentation

- [ ] **README.md** is updated with:
  - Project description
  - Setup instructions
  - Deployment instructions

- [ ] **DEPLOYMENT.md** has platform-specific instructions

- [ ] **API documentation** is available (if needed)

- [ ] **Admin guide** for managing resources

- [ ] **Student guide** for accessing resources

## 🎯 Performance

- [ ] **Lighthouse score** is good (optional)
  - Performance: >90
  - Accessibility: >90
  - Best Practices: >90
  - SEO: >90

- [ ] **Load time** is acceptable (<3 seconds)

- [ ] **API response times** are fast (<500ms)

- [ ] **Database queries** are optimized

## 🔄 Backup & Recovery

- [ ] **Database backup** strategy is in place

- [ ] **Code is in version control** (Git)

- [ ] **Environment variables** are documented

- [ ] **Recovery plan** is documented

## 📞 Support

- [ ] **Support contact** is available

- [ ] **Issue tracking** is set up (GitHub Issues, etc.)

- [ ] **User documentation** is accessible

---

## Quick Verification Commands

Run these commands to verify your setup:

```bash
# 1. Check environment
npm run prod:check

# 2. Type check
npm run typecheck

# 3. Build
npm run build

# 4. Test locally
npm run start

# 5. Check for vulnerabilities
npm audit

# 6. Check for outdated packages
npm outdated
```

## Pre-Deployment Command

Run this before every deployment:

```bash
npm run verify && npm run prod:check
```

---

## ✅ Ready to Deploy?

If all items are checked, you're ready to deploy! 🚀

See [DEPLOYMENT.md](./DEPLOYMENT.md) for platform-specific deployment instructions.

---

**Last Updated**: December 2024
