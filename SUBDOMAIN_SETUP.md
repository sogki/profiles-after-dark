# Subdomain Setup Guide: dev.profilesafterdark.com

> **Quick Setup?** See [RAILWAY_SUBDOMAIN_SETUP.md](./RAILWAY_SUBDOMAIN_SETUP.md) for the simple 5-minute guide!

This guide will help you set up `dev.profilesafterdark.com/api/v1` for your API server hosted on Railway, while your main website is on Vercel.

## Overview

- **Main Website**: Vercel (profilesafterdark.com)
- **API Server**: Railway (dev.profilesafterdark.com/api/v1)
- **Subdomain**: dev.profilesafterdark.com

## Quick Method (Recommended): Use Railway's Built-in Custom Domain

**Simplest approach**: Let Railway handle everything!

1. Railway Dashboard → Your Service → Settings → Networking
2. Add custom domain: `dev.profilesafterdark.com`
3. Copy the DNS records Railway gives you
4. Add those DNS records to your domain provider
5. Wait 5-10 minutes - Railway does the rest!

See [RAILWAY_SUBDOMAIN_SETUP.md](./RAILWAY_SUBDOMAIN_SETUP.md) for detailed steps.

---

## Alternative: Manual DNS Configuration

## Step 1: DNS Configuration

### Option A: Using Vercel DNS (Recommended)

If your domain is managed by Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Add the subdomain: `dev.profilesafterdark.com`
3. Vercel will provide DNS records automatically
4. Add a **CNAME** record pointing to your Railway domain

### Option B: Using External DNS Provider

If your domain is managed elsewhere (Cloudflare, Namecheap, etc.):

1. Log into your DNS provider
2. Add a **CNAME** record:
   ```
   Type: CNAME
   Name: dev
   Value: your-railway-domain.railway.app
   TTL: 3600 (or Auto)
   ```

3. Wait for DNS propagation (can take up to 48 hours, usually much faster)

**Example (Cloudflare):**
```
Type: CNAME
Name: dev
Target: your-app.up.railway.app
Proxy: Off (for API, proxy should be disabled)
```

## Step 2: Railway Configuration

### A. Get Your Railway Domain

1. Go to **Railway Dashboard** → Your API Service
2. Go to **Settings** → **Networking**
3. Note your Railway domain: `your-app.up.railway.app`
4. This is what your CNAME should point to

### B. Configure Railway Environment Variables

1. In Railway, go to your API service → **Variables**
2. Add these environment variables:

```env
PORT=3000
NODE_ENV=production
API_URL=https://dev.profilesafterdark.com
WEB_URL=https://profilesafterdark.com
```

### C. Update Railway Domain (Optional)

If you want Railway to generate a custom domain:

1. Go to **Settings** → **Networking**
2. Add custom domain: `dev.profilesafterdark.com`
3. Railway will provide DNS records to verify ownership

## Step 3: Vercel Configuration

### A. Configure Main Domain Redirect (Optional)

If you want `dev.profilesafterdark.com` to redirect API calls:

1. In Vercel, create a new project or update existing one
2. Add domain: `dev.profilesafterdark.com`
3. Create a `vercel.json` file:

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-railway-app.up.railway.app/api/:path*"
    }
  ]
}
```

**Note**: This is only if you want Vercel to proxy API requests. Otherwise, skip this step.

### B. Alternative: Direct DNS to Railway

For better performance, point the subdomain directly to Railway:

1. Don't add `dev.profilesafterdark.com` to Vercel
2. Point DNS directly to Railway (as in Step 1)
3. Railway handles all traffic for the subdomain

## Step 4: Railway Deployment Configuration

### A. Update Railway Port Configuration

Ensure Railway is using the correct port:

1. In Railway → **Settings** → **Deploy**
2. Set **Start Command**: `npm run start:api` or `node api/server.js`
3. Railway should auto-detect Node.js

### B. Create `railway.json` (if needed)

Create `night-owl-bot/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:api",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Step 5: Update API Server Configuration

### A. Update CORS Settings

In `night-owl-bot/api/server.js`, update CORS:

```javascript
app.use(cors({
  origin: [
    'https://profilesafterdark.com',
    'https://www.profilesafterdark.com',
    'https://dev.profilesafterdark.com',
    'http://localhost:3000', // For local development
    'http://localhost:5173'  // For Vite dev server
  ],
  credentials: true
}));
```

### B. Update API URL in Configuration

Run the setup script to update your API URL:

```bash
cd night-owl-bot
# Update your .env with the new API_URL
API_URL=https://dev.profilesafterdark.com npm run setup:config
```

Or update in Supabase `bot_config` table:
```sql
UPDATE bot_config 
SET value = 'https://dev.profilesafterdark.com' 
WHERE key = 'API_URL';
```

## Step 6: SSL/HTTPS Configuration

### Railway

Railway automatically provides SSL certificates for:
- `your-app.up.railway.app`
- Custom domains you add

No additional configuration needed!

### Vercel

Vercel automatically provides SSL for all domains added to your project.

## Step 7: Verify Setup

### A. Check DNS Propagation

```bash
# Check if DNS is resolving
nslookup dev.profilesafterdark.com

# Or use dig
dig dev.profilesafterdark.com
```

### B. Test API Endpoints

1. **Health Check:**
   ```bash
   curl https://dev.profilesafterdark.com/health
   ```

2. **API v1 Info:**
   ```bash
   curl https://dev.profilesafterdark.com/api/v1
   ```

3. **Test Endpoint:**
   ```bash
   curl https://dev.profilesafterdark.com/api/v1/stats
   ```

### C. Test from Browser

Visit:
- `https://dev.profilesafterdark.com/health`
- `https://dev.profilesafterdark.com/api/v1`
- `https://dev.profilesafterdark.com/api/v1/stats`

## Step 8: Update Environment Variables

### A. Update `.env` for Local Development

In `night-owl-bot/.env`:

```env
API_URL=https://dev.profilesafterdark.com
BACKEND_URL=https://dev.profilesafterdark.com
WEB_URL=https://profilesafterdark.com
```

### B. Update Database Configuration

Run the setup script to sync config:

```bash
cd night-owl-bot
npm run setup:config
```

## Step 9: Frontend Integration

### A. Update Frontend API Calls

In your Vite/React app, create an API client:

```javascript
// src/utils/api.js
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://dev.profilesafterdark.com/api/v1'
  : 'http://localhost:3000/api/v1';

export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    return response.json();
  },
  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
```

### B. Update `.env` Files

**For production (Vercel):**
```env
VITE_API_URL=https://dev.profilesafterdark.com/api/v1
```

**For development:**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Troubleshooting

### Issue: DNS Not Resolving

**Solutions:**
1. Wait up to 48 hours for DNS propagation
2. Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
3. Check DNS records in your provider
4. Verify CNAME is pointing to correct Railway domain

### Issue: SSL Certificate Error

**Solutions:**
1. Railway SSL certificates may take a few minutes to provision
2. Wait 5-10 minutes after adding custom domain
3. Verify domain is correctly added in Railway

### Issue: CORS Errors

**Solutions:**
1. Update CORS configuration in `api/server.js`
2. Ensure frontend domain is in CORS allowed origins
3. Check if credentials are required

### Issue: 404 Not Found

**Solutions:**
1. Verify Railway service is running
2. Check Railway logs for errors
3. Verify the route exists: `/api/v1/health`
4. Check Railway networking settings

### Issue: Connection Refused

**Solutions:**
1. Verify Railway service is deployed and running
2. Check Railway deployment logs
3. Verify PORT environment variable is set
4. Check Railway service status

## Production Checklist

- [ ] DNS CNAME record added and propagated
- [ ] Railway domain configured
- [ ] Railway environment variables set
- [ ] API server CORS configured
- [ ] SSL certificates active (automatic)
- [ ] Health check endpoint working
- [ ] API v1 endpoints responding
- [ ] Frontend API URL updated
- [ ] Database config updated with new API_URL
- [ ] Rate limiting configured
- [ ] Error handling in place

## Quick Reference

**API Base URL:**
```
Production: https://dev.profilesafterdark.com/api/v1
Development: http://localhost:3000/api/v1
```

**Health Check:**
```
https://dev.profilesafterdark.com/health
```

**Main Endpoints:**
- Profiles: `/api/v1/profiles`
- Emotes: `/api/v1/emotes`
- Wallpapers: `/api/v1/wallpapers`
- Discord: `/api/v1/discord`
- Moderation: `/api/v1/moderation`
- Stats: `/api/v1/stats`
- Search: `/api/v1/search`

## Support

If you encounter issues:
1. Check Railway deployment logs
2. Check Railway service status
3. Verify DNS propagation with online tools
4. Test API endpoints with curl or Postman
5. Check browser console for CORS errors

