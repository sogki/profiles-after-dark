# Bot Config Setup Guide

## Key Configuration Values

### 1. **API_URL** (Consolidated - No VITE_ version needed)

**Current Setup:**
- We now use a single key: `API_URL`
- The API route (`/api/v1/config`) automatically creates `VITE_API_URL` from `API_URL` for frontend compatibility
- Frontend code prefers `API_URL` but falls back to `VITE_API_URL` for backward compatibility

**Recommendation:**
- Set `API_URL` = `https://dev.profilesafterdark.com` (or your production URL)
- The API route will automatically create `VITE_API_URL` = `https://dev.profilesafterdark.com`
- Frontend code will use `API_URL` from the API response

**SQL Update:**
```sql
UPDATE public.bot_config 
SET value = 'https://dev.profilesafterdark.com' 
WHERE key = 'API_URL';

-- VITE_API_URL will be automatically created by the API route
-- You can delete VITE_API_URL from the database if it exists
```

---

### 2. **SUPABASE_ANON_KEY** (Consolidated - No VITE_ version needed)

**Current Setup:**
- We now use a single key: `SUPABASE_ANON_KEY`
- The API route automatically creates `VITE_SUPABASE_ANON_KEY` from `SUPABASE_ANON_KEY` for frontend compatibility
- Frontend code prefers `SUPABASE_ANON_KEY` but falls back to `VITE_SUPABASE_ANON_KEY` for backward compatibility

**Where to find:**
- Supabase Dashboard → Project Settings → API → `anon` `public` key

**SQL Update:**
```sql
-- Only need to set SUPABASE_ANON_KEY (single source of truth)
UPDATE public.bot_config 
SET value = 'your_supabase_anon_key_here' 
WHERE key = 'SUPABASE_ANON_KEY';

-- VITE_SUPABASE_ANON_KEY will be automatically created by the API route
-- You can delete VITE_SUPABASE_ANON_KEY from the database if it exists
```

**Note:** The frontend code now uses `SUPABASE_ANON_KEY` from the API (if not marked as secret) or falls back to environment variables.

---

### 3. **SUPABASE_CUSTOM_DOMAIN**

**Purpose:** Custom domain for Supabase (if configured)

**Where to find:**
- Supabase Dashboard → Project Settings → Custom Domains
- If you have a custom domain set up, use that URL
- If not using a custom domain, leave empty or use the default Supabase URL

**SQL Update:**
```sql
-- If using custom domain:
UPDATE public.bot_config 
SET value = 'https://api.profilesafterdark.com' 
WHERE key = 'SUPABASE_CUSTOM_DOMAIN';

-- If NOT using custom domain, leave empty:
UPDATE public.bot_config 
SET value = '' 
WHERE key = 'SUPABASE_CUSTOM_DOMAIN';
```

---

### 4. **STAFF_LOG_CHANNEL_ID**

**Purpose:** Discord channel ID for staff logs

**How to get:**
1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click on the channel where you want staff logs
3. Click "Copy ID"
4. Paste the ID (it's a long number like `123456789012345678`)

**SQL Update:**
```sql
UPDATE public.bot_config 
SET value = '123456789012345678' 
WHERE key = 'STAFF_LOG_CHANNEL_ID';
```

---

### 5. **SESSION_SECRET**

**Purpose:** Secret key for session management (if using sessions)

**How to generate:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

**SQL Update:**
```sql
UPDATE public.bot_config 
SET value = 'your_generated_secret_here' 
WHERE key = 'SESSION_SECRET';
```

**Note:** This is currently not used in the codebase, but it's good to have for future session management.

---

### 6. **JWT_SECRET**

**Purpose:** Secret key for JWT token signing (if using custom JWT)

**How to generate:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

**SQL Update:**
```sql
UPDATE public.bot_config 
SET value = 'your_generated_secret_here' 
WHERE key = 'JWT_SECRET';
```

**Note:** This is currently not used in the codebase (Supabase handles JWT), but it's good to have for future custom JWT implementations.

---

### 7. **ENCRYPTION_KEY**

**Purpose:** Secret key for encrypting sensitive data

**How to generate:**
```bash
# Using Node.js (for AES-256, need 32 bytes = 64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

**SQL Update:**
```sql
UPDATE public.bot_config 
SET value = 'your_generated_secret_here' 
WHERE key = 'ENCRYPTION_KEY';
```

**Note:** This is currently not used in the codebase, but it's good to have for future encryption needs.

---

### 8. **DATABASE_URL**

**Purpose:** Direct database connection string (if not using Supabase client)

**Where to find:**
- Supabase Dashboard → Project Settings → Database → Connection String
- Use the "Connection pooling" or "Direct connection" string
- Format: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`

**SQL Update:**
```sql
UPDATE public.bot_config 
SET value = 'postgresql://postgres:password@db.xxx.supabase.co:5432/postgres' 
WHERE key = 'DATABASE_URL';
```

**Note:** This is currently not used in the codebase (using Supabase client instead), but it's good to have for direct database connections.

---

## Quick Setup Script

You can run this SQL script to update all values at once:

```sql
-- API Configuration (single key - no VITE_ version needed)
UPDATE public.bot_config SET value = 'https://dev.profilesafterdark.com' WHERE key = 'API_URL';

-- Supabase Configuration (single key - no VITE_ version needed)
UPDATE public.bot_config SET value = 'your_supabase_anon_key_here' WHERE key = 'SUPABASE_ANON_KEY';
UPDATE public.bot_config SET value = 'https://api.profilesafterdark.com' WHERE key = 'SUPABASE_CUSTOM_DOMAIN'; -- or leave empty

-- Discord Configuration
UPDATE public.bot_config SET value = '123456789012345678' WHERE key = 'STAFF_LOG_CHANNEL_ID';

-- Security Secrets (generate these using the commands above)
UPDATE public.bot_config SET value = 'your_generated_session_secret' WHERE key = 'SESSION_SECRET';
UPDATE public.bot_config SET value = 'your_generated_jwt_secret' WHERE key = 'JWT_SECRET';
UPDATE public.bot_config SET value = 'your_generated_encryption_key' WHERE key = 'ENCRYPTION_KEY';

-- Database Configuration
UPDATE public.bot_config SET value = 'postgresql://postgres:password@db.xxx.supabase.co:5432/postgres' WHERE key = 'DATABASE_URL';

-- Remove duplicate VITE_ keys (they're now automatically created by the API route)
DELETE FROM public.bot_config WHERE key IN (
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_CUSTOM_DOMAIN',
    'VITE_API_URL',
    'VITE_BACKEND_URL',
    'VITE_WEB_URL'
);
```

---

## Summary

1. **VITE_API_URL**: Automatically created from `API_URL` by the API route - no action needed
2. **SUPABASE_ANON_KEY** & **VITE_SUPABASE_ANON_KEY**: Both need the same value (Supabase anon key)
3. **SUPABASE_CUSTOM_DOMAIN**: Set if using custom domain, otherwise leave empty
4. **STAFF_LOG_CHANNEL_ID**: Discord channel ID for staff logs
5. **SESSION_SECRET, JWT_SECRET, ENCRYPTION_KEY**: Generate using the commands above
6. **DATABASE_URL**: Get from Supabase Dashboard (Connection String)

All of these keys are stored securely in the `bot_config` table and can be updated using SQL UPDATE statements or the `set_bot_config` function.

