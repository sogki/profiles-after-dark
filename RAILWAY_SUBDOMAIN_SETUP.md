# Simple Railway Subdomain Setup

## Quick Steps (5 minutes)

### 1. Add Custom Domain in Railway

1. Go to **Railway Dashboard** → Your API Service
2. Click **Settings** → **Networking**
3. Scroll to **Custom Domain** section
4. Click **Generate Domain** or enter: `dev.profilesafterdark.com`
5. Railway will show you **DNS records to add**

### 2. Add DNS Records to Your Domain Provider

Railway will give you something like:
```
Type: CNAME
Name: dev
Value: cname.railway.app
```

**Copy these exact records** and add them to your DNS provider (wherever you manage `profilesafterdark.com`).

**Examples:**

**Cloudflare:**
1. Go to your domain → DNS → Records
2. Add record:
   - Type: CNAME
   - Name: `dev`
   - Target: `cname.railway.app` (or what Railway gave you)
   - Proxy status: **Off** (gray cloud)
   - Save

**Namecheap/GoDaddy/etc:**
1. Go to Advanced DNS
2. Add CNAME record:
   - Host: `dev`
   - Value: `cname.railway.app` (or what Railway gave you)
   - Save

### 3. Wait (5-10 minutes)

Railway will automatically:
- ✅ Provision SSL certificate
- ✅ Route traffic to your API
- ✅ Update status when domain is active

### 4. Done!

Your API will be live at:
```
https://dev.profilesafterdark.com/api/v1
```

Test it:
```bash
curl https://dev.profilesafterdark.com/health
```

## That's It!

Railway handles everything else automatically:
- ✅ SSL/HTTPS certificates
- ✅ Domain verification
- ✅ Traffic routing
- ✅ DNS health checks

## If You Already Set Up with Vercel

If you already added the domain to Vercel, you have two options:

### Option A: Remove from Vercel, Use Railway (Recommended)

1. Remove `dev.profilesafterdark.com` from Vercel
2. Follow the steps above to add it to Railway

### Option B: Keep Vercel Setup

If you want to keep Vercel handling the domain:
1. In Vercel, set up a rewrite/proxy to Railway
2. More complex, but works if you need it

**I recommend Option A** - it's simpler and more direct.

## Troubleshooting

**Domain shows "Pending" in Railway?**
- Wait 5-10 minutes for DNS propagation
- Check DNS records are correct
- Verify CNAME points to Railway's provided value

**SSL Certificate Issues?**
- Railway auto-provisions SSL, just wait a few minutes
- Make sure DNS is properly configured

**Still not working?**
- Check Railway logs for errors
- Verify DNS propagation: `nslookup dev.profilesafterdark.com`
- Contact Railway support (they're helpful!)

## Summary

1. Add domain in Railway → Get DNS records
2. Add DNS records to your domain provider
3. Wait 5-10 minutes
4. Done! 🎉

