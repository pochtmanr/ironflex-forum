# Iron Blog - Forum Application

A modern forum application built with Next.js, MongoDB, and TypeScript.

## 🌟 Features

- ✅ User authentication (register, login, email verification)
- ✅ Forum categories and topics
- ✅ Rich text editor with markdown support
- ✅ Comment system with 2-hour edit/delete window
- ✅ Like/dislike system for topics and posts
- ✅ Flag/report system for inappropriate content
- ✅ Admin dashboard for content management
- ✅ Email notifications (verification, password reset, welcome)
- ✅ Image uploads
- ✅ Responsive design (mobile & desktop)
- ✅ User profiles
- ✅ Top topics widget

## 🚀 Quick Start (Development)

### Prerequisites

- Node.js 18+
- MongoDB
- SMTP server (for emails)

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/iron-blog.git
cd iron-blog

# Install dependencies
npm install

# Copy environment template
cp .env.template .env.local

# Edit .env.local with your settings
nano .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## 📦 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete production deployment guide.

### Quick Deploy

```bash
# On your server
git clone https://github.com/YOUR_USERNAME/iron-blog.git
cd iron-blog
cp .env.template .env.production
# Edit .env.production with production values
npm install
npm run build
./deploy.sh
```

## 🔧 Environment Variables

See `.env.template` for all available configuration options.

### Required Variables

```env
MONGODB_URI=mongodb://localhost:27017/iron-blog
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
NEXT_PUBLIC_SITE_URL=https://tarnovsky.ru
FROM_EMAIL=admin@tarnovsky.ru
```

## 📧 Email Configuration

The application uses SMTP for sending emails:

- Email verification
- Password reset
- Welcome emails

Configure in `.env.local` or `.env.production`:

```env
SMTP_HOST=95.163.180.91
SMTP_PORT=25
FROM_EMAIL=admin@tarnovsky.ru
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (access & refresh tokens)
- **Email**: Nodemailer
- **Rich Text**: Lexical Editor
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📁 Project Structure

```
iron-blog/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── admin/        # Admin dashboard
│   │   ├── auth/         # Authentication pages
│   │   └── topic/        # Topic pages
│   ├── components/       # React components
│   │   ├── Auth/         # Auth components
│   │   ├── Forum/        # Forum components
│   │   ├── Topic/        # Topic components
│   │   └── UI/           # UI components
│   ├── contexts/         # React contexts
│   ├── lib/              # Utilities
│   ├── models/           # MongoDB models
│   └── services/         # API services
├── public/               # Static files
├── .env.template         # Environment template
├── deploy.sh             # Deployment script
└── DEPLOYMENT.md         # Deployment guide
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Email verification
- CSRF protection
- Rate limiting (recommended to add)
- Input validation
- XSS protection

## 📊 Admin Dashboard

Access at `/admin` (requires admin privileges)

Features:
- User management
- Topic management
- Post management
- Flagged content review
- Statistics overview

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs iron-blog
```

### Email not sending
```bash
# Test SMTP connection
telnet 95.163.180.91 25
```

### Database connection issues
```bash
# Check MongoDB
sudo systemctl status mongod
```

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: admin@tarnovsky.ru

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the database
- All contributors

---

Made with ❤️ for Клинический Протокол Тарновского
