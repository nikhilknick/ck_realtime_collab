# Deployment Guide

This guide covers deploying the real-time collaborative editor to production.

## Architecture Overview

**Frontend:** Static React app (Vite build)
**Backend:** Node.js Express server
**Database:** Supabase (PostgreSQL)
**Authentication:** Supabase Auth (Google OAuth)
**Collaboration:** CKEditor Cloud Services

## Prerequisites

- Completed Supabase setup (see `SUPABASE_SETUP.md`)
- CKEditor Cloud Services account with production credentials
- Domain name (optional but recommended)

## Option 1: Vercel (Frontend) + Railway (Backend)

This is the recommended setup for small to medium applications.

### Deploy Backend to Railway

1. **Create Railway account:** https://railway.app
2. **Create new project:**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Connect your repository
   - Select the `production-ready` branch

3. **Configure root directory:**
   - Go to project settings
   - Set "Root Directory" to `server`

4. **Add environment variables:**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   CKEDITOR_ENVIRONMENT_ID=your-env-id
   CKEDITOR_API_SECRET=your-api-secret
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   PORT=3001
   ```

5. **Deploy:**
   - Railway will auto-deploy
   - Note your Railway URL: `https://your-app.railway.app`

### Deploy Frontend to Vercel

1. **Create Vercel account:** https://vercel.com
2. **Import project:**
   - Click "Add New" → "Project"
   - Import from GitHub
   - Select your repository

3. **Configure build settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add environment variables:**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_CKEDITOR_TOKEN_URL=https://your-app.railway.app/cs-token
   VITE_CKEDITOR_WS_URL=wss://your-env.cke-cs.com/ws
   VITE_CKEDITOR_ENVIRONMENT_ID=your-env-id
   VITE_CKEDITOR_LICENSE_KEY=your-license-key
   ```

5. **Deploy:**
   - Click "Deploy"
   - Note your Vercel URL: `https://your-app.vercel.app`

6. **Update Google OAuth:**
   - Go to Google Cloud Console
   - Add new redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Update allowed origins in Supabase

## Option 2: Single Server (VPS/Docker)

For full control, deploy to a single VPS with Docker.

### Prerequisites

- VPS with Docker installed (DigitalOcean, AWS EC2, etc.)
- Domain name pointed to your VPS
- SSL certificate (Let's Encrypt)

### Create Dockerfile

**Backend Dockerfile** (`server/Dockerfile`):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

**Frontend Dockerfile** (`Dockerfile`):
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - CKEDITOR_ENVIRONMENT_ID=${CKEDITOR_ENVIRONMENT_ID}
      - CKEDITOR_API_SECRET=${CKEDITOR_API_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - NODE_ENV=production
    restart: unless-stopped

  frontend:
    build: .
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    restart: unless-stopped
```

### Deploy

```bash
# SSH into your VPS
ssh user@your-server.com

# Clone repository
git clone https://github.com/yourusername/realtime-collab.git
cd realtime-collab
git checkout production-ready

# Create .env file
nano .env
# Add all production environment variables

# Build and start containers
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Setup Nginx with SSL

1. Install Certbot
2. Get SSL certificate:
   ```bash
   certbot certonly --webroot -w /path/to/app/dist -d yourdomain.com
   ```
3. Update nginx.conf to use SSL

## Option 3: AWS (Full Stack)

### Architecture

- **Frontend:** S3 + CloudFront
- **Backend:** ECS Fargate or Lambda
- **Database:** Supabase (or RDS PostgreSQL)

### Deploy Frontend to S3 + CloudFront

1. Build frontend:
   ```bash
   npm run build
   ```

2. Create S3 bucket:
   - Enable static website hosting
   - Upload `dist` folder contents

3. Create CloudFront distribution:
   - Origin: S3 bucket
   - Enable HTTPS
   - Set custom domain

4. Update DNS to point to CloudFront

### Deploy Backend to ECS Fargate

1. Push Docker image to ECR
2. Create ECS cluster
3. Define task with environment variables
4. Create service with load balancer
5. Configure security groups

## Post-Deployment Checklist

### Security

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured correctly
- [ ] Service role key only in backend
- [ ] Google OAuth redirect URIs updated
- [ ] Supabase RLS enabled and tested

### Performance

- [ ] Frontend assets minified and gzipped
- [ ] CDN configured (CloudFront, Vercel Edge, etc.)
- [ ] Database indexes created
- [ ] API response caching enabled
- [ ] CKEditor assets loaded from CDN

### Monitoring

- [ ] Error tracking (Sentry, LogRocket)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Analytics (Google Analytics, Plausible)
- [ ] Server logs aggregated (CloudWatch, Railway logs)
- [ ] Supabase database monitoring enabled

### Testing

- [ ] Authentication flow works
- [ ] Document CRUD operations work
- [ ] Real-time collaboration works
- [ ] Multiple users can edit simultaneously
- [ ] Token refresh works correctly
- [ ] Sign out works
- [ ] Mobile responsive
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

## Environment Variables Summary

### Frontend (Must have `VITE_` prefix)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_CKEDITOR_TOKEN_URL=https://your-backend.com/cs-token
VITE_CKEDITOR_WS_URL=wss://your-env.cke-cs.com/ws
VITE_CKEDITOR_ENVIRONMENT_ID=your-env-id
VITE_CKEDITOR_LICENSE_KEY=your-license
```

### Backend

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
CKEDITOR_ENVIRONMENT_ID=your-env-id
CKEDITOR_API_SECRET=your-secret
FRONTEND_URL=https://your-frontend.com
NODE_ENV=production
PORT=3001
```

## Troubleshooting

### "CORS error" in production

- Update `FRONTEND_URL` in backend `.env`
- Add your frontend domain to CORS allowed origins
- Check that preflight OPTIONS requests are handled

### "Token request failed"

- Verify `VITE_CKEDITOR_TOKEN_URL` points to deployed backend
- Check backend logs for authentication errors
- Ensure Authorization header is sent correctly

### "Failed to connect to CKEditor"

- Verify WebSocket URL is correct
- Check that CKEditor environment is active
- Ensure license key is valid

### "Unauthorized" when accessing documents

- Check Supabase RLS policies
- Verify user is authenticated
- Check browser console for token expiration

### Railway/Vercel build fails

- Check build logs for specific errors
- Verify all dependencies are in package.json
- Check Node version compatibility
- Ensure environment variables are set

## Scaling Considerations

### Database

- **Supabase Free Tier:** 500 MB storage, 2 GB bandwidth
- **Upgrade:** Supabase Pro for more resources
- **Alternative:** Migrate to self-hosted PostgreSQL

### Backend

- **Railway:** Auto-scales within limits
- **Vercel:** Serverless functions scale automatically
- **VPS:** Add load balancer + multiple servers

### CKEditor Cloud Services

- **Pricing:** Based on active users/month
- **Monitoring:** Check usage in CKEditor dashboard
- **Scaling:** Contact CKEditor for enterprise plans

## Backup Strategy

### Supabase Database

1. Enable automatic backups in Supabase dashboard
2. Download manual backups regularly:
   ```bash
   pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
   ```

### User Data

- Documents are stored in Supabase (backed up automatically)
- CKEditor content is synced in real-time
- Consider periodic exports for critical data

## Rollback Plan

1. Keep previous deployment URLs active
2. Tag releases in git
3. Keep backups of environment variables
4. Document deployment steps
5. Test rollback procedure in staging

## Support

- **Supabase:** https://supabase.com/docs
- **CKEditor:** https://ckeditor.com/docs/
- **Railway:** https://docs.railway.app
- **Vercel:** https://vercel.com/docs
