# Migrating Configuration to Database

This guide explains how to move your configuration keys from `.env` to the Supabase database.

## Step 1: Run the Database Migration

First, ensure the `bot_config` table exists in Supabase:

```bash
# The migration file is at:
# supabase/migrations/20250115000004_bot_config_table.sql
```

If you're using Supabase CLI:
```bash
supabase migration up
```

Or run the migration manually in your Supabase SQL editor.

## Step 2: Set Up Environment Variables

Ensure your `.env` file has the required values. The setup script will read from these:

- `DISCORD_TOKEN` - Your Discord bot token (secret)
- `CLIENT_ID` - Your Discord bot client ID
- `GUILD_ID` - Your Discord guild/server ID (optional)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (secret)
- `API_URL` - API server URL
- `BACKEND_URL` - Backend URL (optional, alias for API_URL)
- `WEB_URL` - Website URL
- `STAFF_LOG_CHANNEL_ID` - Discord channel ID for staff logs (optional)

## Step 3: Run the Setup Script

Navigate to the bot directory and run:

```bash
cd night-owl-bot
npm run setup:config
```

This will:
1. Read all configuration values from your `.env` file
2. Insert them into the `bot_config` table in Supabase
3. Show you which values were successfully set
4. Warn about missing values

## Step 4: Verify Configuration

After running the setup script, you should see output like:

```
✅ Set config: DISCORD_TOKEN (secret)
✅ Set config: CLIENT_ID (public)
✅ Set config: SUPABASE_URL (public)
...

✅ Initialized 8 configuration value(s)
```

## Step 5: Test the Bot

Start your bot to verify it's loading configuration from the database:

```bash
npm start
```

You should see:
```
📋 Loading configuration...
✅ Loaded 8 configuration value(s) from database
```

## How It Works

The bot will:
1. **First** try to load configuration from the database
2. **Fallback** to environment variables if the database is unavailable
3. **Cache** configuration values for 5 minutes to reduce database calls

## Updating Configuration

To update a configuration value, you can:

1. **Via Supabase Dashboard**: Edit directly in the `bot_config` table
2. **Via Code**: Use the `setConfig()` function
3. **Via .env + Script**: Update `.env` and run `npm run setup:config` again

## Security Notes

- Secret values (like `DISCORD_TOKEN`) are marked with `is_secret = true` in the database
- Only the service role can access all configuration values
- Regular users cannot view secret configuration
- Environment variables can be kept as a fallback for security

## Troubleshooting

### "Supabase client not initialized"
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env`
- The service role key is required to access the `bot_config` table

### "Failed to set config"
- Verify the `bot_config` table exists (run the migration)
- Check your Supabase credentials are correct
- Ensure RLS policies allow service role access

### "Configuration not loading"
- The bot falls back to environment variables
- Check that either database or `.env` has the required values
- Verify Supabase connection is working

