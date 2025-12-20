# 🎓 DHDC E-Resource Platform

A modern, secure learning resource management system built for educational institutions. Students can access curated learning materials, and administrators can manage resources through an intuitive dashboard.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

## ✨ Features

### For Students
- 🔐 **Secure Login** - Authentication using admission number
- 📚 **Resource Library** - Access to curated learning materials
- 🎥 **Rich Media Support** - Embedded videos, PDFs, articles, and more
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🎨 **Modern UI** - Beautiful, intuitive interface

### For Administrators
- 👥 **User Management** - Manage student and admin accounts
- 📝 **Resource Management** - Create, edit, and delete learning resources
- 🔗 **URL Embedding** - Automatic embedding for YouTube, PDFs, and more
- 🔒 **Role-Based Access** - Secure admin-only features
- 📊 **Dashboard** - Overview of all resources

### Technical Features
- ⚡ **Fast Performance** - Built with Vite and React
- 🔒 **Secure** - JWT authentication, security headers, CORS protection
- 🗄️ **MongoDB** - Scalable database with Mongoose ODM
- 🎯 **TypeScript** - Type-safe codebase
- 🚀 **Production Ready** - Optimized builds, error handling, monitoring
- 📦 **Easy Deployment** - Pre-configured for Netlify, Vercel, and more

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (free tier available)
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/dhdc-resource.git
   cd dhdc-resource
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```bash
   NODE_ENV=development
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-secure-random-string
   ```

4. **Generate a secure JWT secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to `http://localhost:8080`

## 📖 Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Complete guide for deploying to production
- **[Setup Guide](./SETUP_GUIDE.md)** - Detailed setup instructions
- **[API Documentation](./AGENTS.md)** - API endpoints and usage

## 🏗️ Project Structure

```
dhdc-resource/
├── client/                 # Frontend React application
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── lib/              # Client utilities and hooks
│   └── global.css        # Global styles
├── server/                # Backend Express application
│   ├── routes/           # API route handlers
│   ├── models/           # Mongoose models
│   ├── lib/              # Server utilities
│   └── data.json         # Student data
├── shared/               # Shared types and utilities
├── netlify/              # Netlify serverless functions
└── public/               # Static assets
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Tanstack Query** - Data fetching
- **Radix UI** - Accessible components
- **Framer Motion** - Animations

### Backend
- **Express 5** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Validation

### Build Tools
- **Vite** - Build tool and dev server
- **SWC** - Fast TypeScript/JavaScript compiler
- **TypeScript** - Type checking

## 📝 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run build:client     # Build client only
npm run build:server     # Build server only
npm run start            # Start production server
npm run typecheck        # Run TypeScript type checking
npm run format.fix       # Format code with Prettier
npm test                 # Run tests
```

## 🔐 Authentication

### Student Login
Students log in using:
- **Admission Number** - From `server/data.json`
- **Name** - For verification (flexible matching)

### Admin Login
Admins use:
- **Email** - Registered email address
- **Password** - Secure password

First admin must be registered through the `/register` page.

## 🌐 Deployment

This application is pre-configured for easy deployment to:

- ✅ **Netlify** (Recommended) - Serverless functions included
- ✅ **Vercel** - Zero-config deployment
- ✅ **Railway** - Simple Git-based deployment
- ✅ **Heroku** - Traditional PaaS
- ✅ **DigitalOcean** - App Platform
- ✅ **Self-Hosted** - VPS with PM2 and Nginx

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Netlify

1. Push your code to GitHub
2. Connect repository to Netlify
3. Set environment variables
4. Deploy!

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ CORS protection
- ✅ Security headers (XSS, clickjacking, MIME sniffing)
- ✅ Request size limits
- ✅ Environment variable protection
- ✅ Production error handling
- ✅ MongoDB injection protection

## 🧪 Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
```

## 📊 Environment Variables

### Required
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `NODE_ENV` - Environment (development/production)

### Optional
- `IFRAME_API_KEY` - Iframely API key for rich embeds
- `IFRAME_END_POINT` - Iframely endpoint URL
- `FRONTEND_URL` - Frontend URL for CORS (production)
- `PING_MESSAGE` - Custom health check message

See `.env.example` for a complete template.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📞 Support

For support and questions:
- 📧 Email: support@dhdc.edu
- 📝 Issues: [GitHub Issues](https://github.com/yourusername/dhdc-resource/issues)
- 📖 Docs: [Documentation](./DEPLOYMENT.md)

## 🗺️ Roadmap

- [ ] Email notifications for new resources
- [ ] Resource categories and filtering
- [ ] Student progress tracking
- [ ] Mobile app (React Native)
- [ ] Offline support (PWA)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Resource recommendations

## 📈 Status

- ✅ Core features complete
- ✅ Production ready
- ✅ Security hardened
- ✅ Deployment ready
- 🔄 Active development

---

**Made with ❤️ for DHDC**

*Last updated: December 2024*
