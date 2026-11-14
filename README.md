# E-Sport Connection 🎮

A full-stack web application for e-sports enthusiasts to connect, form teams, and compete in tournaments. Built with modern technologies and a beautiful, responsive design.

## 🚀 Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React 19 Hooks** - State management and side effects

### Backend

- **Fastify 4** - HTTP API framework
- **TypeScript** - Type-safe Node.js development
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing and security

## 📁 Project Structure

```
e-sport-connection/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   └── app/
│   │       ├── auth/         # Authentication pages
│   │       ├── globals.css   # Global styles
│   │       ├── layout.tsx    # Root layout
│   │       └── page.tsx      # Homepage
│   ├── package.json
│   └── README.md
├── backend/                  # Express.js backend API
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   └── index.ts         # Server entry point
│   ├── package.json
│   └── README.md
└── README.md                # This file
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (local or cloud)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd e-sport-connection
```

### 2. Backend Setup

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **API Health Check**: http://localhost:5001/health

## 🎨 Features

### Frontend Features

- ✨ **Modern UI/UX** - Beautiful glassmorphism design
- 📱 **Responsive Design** - Mobile-first approach
- 🔐 **Authentication** - Login and registration forms
- ⚡ **Performance** - Optimized with Next.js
- 🎯 **Animations** - Smooth transitions and effects

### Backend Features

- 🔒 **JWT Authentication** - Secure token-based auth
- 🛡️ **Security** - Password hashing, CORS, Helmet
- 📊 **Database** - MongoDB with Mongoose ODM
- 🔄 **API** - RESTful endpoints
- 📝 **Logging** - Request logging with Morgan

## 📡 API Endpoints

### Authentication

- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `GET /api/v1/users/profile` - Get user profile (protected)
- `PUT /api/v1/users/profile` - Update user profile (protected)

### Health Check

- `GET /health` - Server health status

### Admin

- `DELETE /api/admin/clear-all` - Clear all data from collections (Admin only)

## 🎮 E-Sport Connection Platform

This platform is designed to help gamers:

### 🏆 **Team Building**

- Find compatible teammates
- Create and manage teams
- Skill-based matching

### 🏅 **Tournament Hub**

- Join competitive tournaments
- Track tournament progress
- Leaderboards and rankings

### 📈 **Performance Analytics**

- Real-time statistics
- Performance tracking
- Improvement insights

### 🌐 **Community**

- Connect with other players
- Share strategies and tips
- Build gaming networks

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based sessions
- **Password Hashing** - Bcrypt encryption
- **CORS Protection** - Cross-origin security
- **Input Validation** - Request data validation
- **Security Headers** - Helmet middleware
- **Rate Limiting** - API protection (planned)

## 🚀 Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Deploy to Vercel or your preferred platform
```

### Backend (Railway/Heroku)

```bash
cd backend
npm run build
# Deploy to your preferred platform
```

### Environment Variables

#### Backend (.env)

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-frontend-domain.com
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
```

## 🔧 Development

### Backend Development

```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
```

### Frontend Development

```bash
cd frontend
npm run dev         # Start development server
npm run build       # Build for production
npm start          # Start production server
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test           # Run tests (to be implemented)
```

### Frontend Testing

```bash
cd frontend
npm test           # Run tests (to be implemented)
```

## 📝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 🤝 Community

- **Discord**: Join our gaming community
- **Discussions**: GitHub Discussions for questions
- **Issues**: Report bugs and request features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **Express.js** community for the robust backend framework
- **Tailwind CSS** for the utility-first CSS framework
- **MongoDB** for the flexible database solution

## 🎯 Roadmap

### Phase 1 ✅

- [x] Basic authentication system
- [x] User registration and login
- [x] Responsive landing page
- [x] Backend API structure

### Phase 2 🚧

- [ ] Team creation and management
- [ ] Tournament system
- [ ] Real-time chat
- [ ] User profiles and avatars

### Phase 3 📋

- [ ] Performance analytics
- [ ] Matchmaking system
- [ ] Social features
- [ ] Mobile app

---

**Made with ❤️ for the gaming community**

# e-sport-connection
