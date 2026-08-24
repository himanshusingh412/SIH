# Production Deployment Procedure — ContentSpine AI

## 1. Production Architecture Overview

In a production environment, ContentSpine AI is deployed as a containerized stack:
* **Frontend**: Static Vite build served via Nginx or Cloudflare Pages.
* **Backend**: Node.js Express API running via PM2 or Docker container.
* **Database**: Managed PostgreSQL database.

---

## 2. Step-by-Step Deployment Guide

### Step 1: Database Provisioning (PostgreSQL)
```bash
export DATABASE_URL="postgresql://sih_user:SecurePass123@postgres-host:5432/content_spine_db?sslmode=require"
```

### Step 2: Build & Migrate Backend
```bash
cd server
npm install --production=false
npx prisma migrate deploy
npm run build
```

### Step 3: Start Production Backend with PM2
```bash
npm install -g pm2
pm2 start dist/index.js --name "content-spine-api" --instances max
```

### Step 4: Build & Serve Frontend Client
```bash
cd ../client
npm install
npm run build
```
Copy `client/dist/` contents to web server root directory (`/var/www/html`).

---

## 3. Environment Health Check
```bash
curl -I http://localhost:5001/api/health
```
Expected Response:
```json
{
  "status": "online",
  "platform": "AI Content Transformation Engine (SIH 2026)",
  "env": "production"
}
```
