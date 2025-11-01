# NightOwl Discord Bot

A Discord bot for Profiles After Dark, featuring moderation tools, gallery browsing, and integration with the web application.

## Features

- **Moderation Commands**: Ban, kick, warn, mute, timeout, and more
- **Gallery Integration**: Browse profiles, emotes, and wallpapers directly from Discord
- **Search Functionality**: Search the web app content from Discord
- **Statistics**: View website statistics
- **User Information**: Get detailed user info with web profile links
- **Moderation Logging**: Track all moderation actions with case management
- **Message Deletion Tracking**: Log deleted messages for moderation review

## Setup

### Prerequisites

- Node.js 18+ 
- Discord Bot Token
- Supabase account and credentials
- Railway account (for deployment)

### Installation

1. Clone the repository
2. Navigate to the bot directory:
   ```bash
   cd night-owl-bot
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Fill in your environment variables:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `CLIENT_ID`: Your Discord bot client ID
   - `GUILD_ID`: Your Discord server ID
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `API_URL`: API server URL (for production)
   - `WEB_URL`: Website URL (defaults to https://profilesafterdark.com)

6. Deploy slash commands:
   ```bash
   npm run deploy
   ```

7. Start the bot:
   ```bash
   npm start
   ```

## Railway Deployment

The bot is configured for Railway deployment with two services:

1. **API Server** (`web`): Express.js API server on port 3000
2. **Bot Worker** (`worker`): Discord bot instance

### Deploying to Railway

1. Create a new Railway project
2. Connect your GitHub repository
3. Railway will automatically detect the `Procfile` and deploy both services
4. Add environment variables in Railway dashboard:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `API_URL` (your Railway API URL)
   - `WEB_URL`

### Railway Configuration

The `Procfile` defines two processes:
- `web`: Runs the API server (`node api/server.js`)
- `worker`: Runs the Discord bot (`node index.js`)

## Commands

### Moderation Commands
- `/ban` - Ban a user from the server
- `/kick` - Kick a user from the server
- `/warn` - Warn a user
- `/mute` - Mute a user
- `/unmute` - Unmute a user
- `/unban` - Unban a user
- `/modlogs` - Manage moderation logs channel

### Gallery Commands
- `/profile <id>` - View a specific profile picture
- `/gallery` - Browse the gallery (profiles, emotes, wallpapers)
- `/search <query>` - Search for content

### Info Commands
- `/info` - Bot information
- `/stats` - Website statistics
- `/userinfo [user]` - Get user information

### General Commands
- `/ping` - Check bot latency
- `/help` - View all available commands

## API Endpoints

The API server provides the following endpoints:

### Profiles
- `GET /api/profiles` - Get all profiles
- `GET /api/profiles/:id` - Get a specific profile

### Emotes
- `GET /api/emotes` - Get all emotes
- `GET /api/emotes/:id` - Get a specific emote

### Wallpapers
- `GET /api/wallpapers` - Get all wallpapers
- `GET /api/wallpapers/:id` - Get a specific wallpaper

### Discord Integration
- `GET /api/discord/users/:discordId` - Get Discord user info
- `POST /api/discord/users` - Create/update Discord user

### Moderation
- `GET /api/moderation/cases/:guildId` - Get moderation cases
- `POST /api/moderation/cases` - Create a moderation case
- `GET /api/moderation/logs/:guildId` - Get moderation logs

### Other
- `GET /api/stats` - Get website statistics
- `GET /api/search` - Search content
- `GET /health` - Health check endpoint

## Database Tables

The bot uses the following Supabase tables:

- `discord_users` - Links Discord users with web app users
- `mod_cases` - Moderation case records
- `mod_logs` - Moderation action logs
- `modlogs_channels` - Per-guild modlog channel settings
- `deleted_messages` - Deleted message cache
- `discord_webhooks` - Webhook configurations
- `guild_settings` - Per-guild bot settings

## Development

### Running Locally

1. Start the API server:
   ```bash
   npm run start:api
   ```

2. Start the bot (in another terminal):
   ```bash
   npm start
   ```

### Project Structure

```
night-owl-bot/
├── api/
│   └── server.js          # Express API server
├── commands/
│   ├── general/           # General commands
│   ├── gallery/          # Gallery commands
│   ├── info/             # Info commands
│   └── staff/            # Moderation commands
├── utils/
│   ├── supabase.js       # Supabase client and helpers
│   ├── staffLogger.js    # Staff action logger
│   └── webhooks.js       # Webhook integration
├── index.js              # Bot entry point
├── deploy-commands.js    # Command deployment script
├── package.json
└── README.md
```

## License

Proprietary - All rights reserved
