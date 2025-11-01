# Profiles After Dark API

RESTful API for Profiles After Dark platform.

## Base URL

```
dev.profilesafterdark.com/api/v1
```

## Versioning

The API uses URL versioning. Current version: **v1**

- **Production**: `https://profilesafterdark.com/api/v1`
- **Development**: `https://dev.profilesafterdark.com/api/v1`
- **Local**: `http://localhost:3000/api/v1`

## Authentication

Currently, all endpoints are public. Authentication will be added in future versions.

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is included in response headers

## Endpoints

### Profiles

#### Get All Profiles
```http
GET /api/v1/profiles
```

**Query Parameters:**
- `category` (string, optional): Filter by category
- `type` (string, optional): Filter by type
- `limit` (number, optional): Number of results (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 20,
  "limit": 20,
  "offset": 0
}
```

#### Get Profile by ID
```http
GET /api/v1/profiles/:id
```

**Response:**
```json
{
  "success": true,
  "data": {...}
}
```

### Emotes

#### Get All Emotes
```http
GET /api/v1/emotes
```

**Query Parameters:**
- `category` (string, optional): Filter by category
- `limit` (number, optional): Number of results (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

#### Get Emote by ID
```http
GET /api/v1/emotes/:id
```

### Wallpapers

#### Get All Wallpapers
```http
GET /api/v1/wallpapers
```

**Query Parameters:**
- `category` (string, optional): Filter by category
- `resolution` (string, optional): Filter by resolution
- `limit` (number, optional): Number of results (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

#### Get Wallpaper by ID
```http
GET /api/v1/wallpapers/:id
```

### Discord Integration

#### Get Discord User
```http
GET /api/v1/discord/users/:discordId
```

#### Create/Update Discord User
```http
POST /api/v1/discord/users
```

**Body:**
```json
{
  "discord_id": "string",
  "username": "string",
  "guild_id": "string",
  "web_user_id": "uuid (optional)",
  "discriminator": "string (optional)",
  "avatar_url": "string (optional)"
}
```

### Moderation

#### Get Moderation Cases
```http
GET /api/v1/moderation/cases/:guildId
```

**Query Parameters:**
- `user_id` (string, optional): Filter by user ID
- `limit` (number, optional): Number of results (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

#### Create Moderation Case
```http
POST /api/v1/moderation/cases
```

#### Get Moderation Logs
```http
GET /api/v1/moderation/logs/:guildId
```

**Query Parameters:**
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

### Statistics

#### Get Website Statistics
```http
GET /api/v1/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profiles": 100,
    "emotes": 50,
    "wallpapers": 75,
    "discordUsers": 200,
    "total": 225
  }
}
```

### Search

#### Search Content
```http
GET /api/v1/search
```

**Query Parameters:**
- `q` (string, required): Search query
- `type` (string, optional): Search type - `all`, `profiles`, `emotes`, `wallpapers` (default: `all`)
- `limit` (number, optional): Number of results per type (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "profiles": [...],
    "emotes": [...],
    "wallpapers": [...]
  },
  "query": "search term",
  "type": "all",
  "total": 45
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `429` - Too Many Requests (Rate Limited)
- `500` - Internal Server Error

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

## Example Usage

```javascript
// Fetch profiles
const response = await fetch('https://dev.profilesafterdark.com/api/v1/profiles?limit=10');
const data = await response.json();

// Search content
const searchResponse = await fetch('https://dev.profilesafterdark.com/api/v1/search?q=anime&type=all');
const searchData = await searchResponse.json();

// Get statistics
const statsResponse = await fetch('https://dev.profilesafterdark.com/api/v1/stats');
const stats = await statsResponse.json();
```

