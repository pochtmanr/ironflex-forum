# 🚀 IronFlex Forum - Server Deployment Guide

Complete step-by-step guide to deploy your forum on your own server.

## 📋 Prerequisites

- Ubuntu/Debian/CentOS server with root access
- Domain name (optional, can use server IP)
- SSH access to your server

---

## 🔧 Step 1: Initial Server Setup

SSH into your server and run:

```bash
# Download and run server setup
wget https://raw.githubusercontent.com/pochtmanr/ironflex-forum/main/deploy/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

Or manually copy the `server-setup.sh` script to your server and run it.

---

## 🔧 Step 2: Deploy Backend

```bash
# Run backend deployment
wget https://raw.githubusercontent.com/pochtmanr/ironflex-forum/main/deploy/backend-deploy.sh
chmod +x backend-deploy.sh
./backend-deploy.sh
```

**Important:** After running this script:

1. **Add Firebase credentials** to `/var/www/ironflex-forum/backend/.env`:

```bash
nano /var/www/ironflex-forum/backend/.env
```

Add your Firebase credentials:
```env
NODE_ENV=production
PORT=5001
FIREBASE_PROJECT_ID=ironflex-64531
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

2. **Start the backend**:
```bash
cd /var/www/ironflex-forum/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🎨 Step 3: Deploy Frontend

```bash
# Run frontend deployment
wget https://raw.githubusercontent.com/pochtmanr/ironflex-forum/main/deploy/frontend-deploy.sh
chmod +x frontend-deploy.sh
./frontend-deploy.sh
```

**Update API URL:** Edit the frontend environment:
```bash
nano /var/www/ironflex-forum/frontend/.env.production
```

Replace `YOUR_SERVER_IP` with your actual server IP or domain:
```env
REACT_APP_API_URL=http://your-server-ip:5001
# or
REACT_APP_API_URL=https://yourdomain.com
```

Then rebuild:
```bash
cd /var/www/ironflex-forum/frontend
npm run build
```

---

## 🌐 Step 4: Configure Nginx

1. **Copy nginx configuration**:
```bash
sudo cp /var/www/ironflex-forum/deploy/nginx-config /etc/nginx/sites-available/ironflex-forum
```

2. **Edit the config** and replace `YOUR_DOMAIN_OR_IP`:
```bash
sudo nano /etc/nginx/sites-available/ironflex-forum
```

3. **Enable the site**:
```bash
sudo ln -s /etc/nginx/sites-available/ironflex-forum /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Step 5: SSL Setup (Optional but Recommended)

If you have a domain name:

```bash
./ssl-setup.sh
sudo certbot --nginx -d yourdomain.com
```

---

## 🎯 Step 6: Transfer Your Database

Copy your local SQLite database to the server:

```bash
# From your local machine
scp /Users/romanpochtman/Developer/forum/ironflex-forum/backend/database.sqlite user@your-server:/var/www/ironflex-forum/backend/
```

---

## ✅ Step 7: Final Checks

1. **Check backend status**: `pm2 status`
2. **Check nginx status**: `sudo systemctl status nginx`
3. **View backend logs**: `pm2 logs ironflex-backend`
4. **Visit your site**: `http://your-server-ip` or `https://yourdomain.com`

---

## 🔧 Useful Commands

```bash
# Backend management
pm2 restart ironflex-backend    # Restart backend
pm2 logs ironflex-backend      # View logs
pm2 stop ironflex-backend      # Stop backend

# Nginx management
sudo systemctl restart nginx    # Restart nginx
sudo nginx -t                  # Test config
sudo systemctl status nginx    # Check status

# Update deployment
cd /var/www/ironflex-forum/backend && git pull && npm run build && pm2 restart ironflex-backend
cd /var/www/ironflex-forum/frontend && git pull && npm run build
```

---

## 🚨 Troubleshooting

- **Backend not starting**: Check `pm2 logs ironflex-backend`
- **Frontend not loading**: Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- **API calls failing**: Verify `REACT_APP_API_URL` in frontend `.env.production`
- **Database issues**: Ensure SQLite file has correct permissions: `chmod 664 database.sqlite`

---

## 🔐 Security Recommendations

1. **Firewall**: Only allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
2. **Updates**: Keep system updated: `sudo apt update && sudo apt upgrade`
3. **Backups**: Regular database backups: `cp database.sqlite database-backup-$(date +%Y%m%d).sqlite`
4. **SSL**: Always use HTTPS in production
5. **Environment**: Never commit `.env` files to git

Your forum should now be live! 🎉
