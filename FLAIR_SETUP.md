# Flair System Setup Guide

Flair is a customizable platform for users to enhance their profiles on platforms like Twitch, YouTube, and Discord. This guide will help you set up and use the Flair system.

## Database Setup

1. **Run the Migration**
   ```bash
   # The migration file is located at:
   # supabase/migrations/20250126000000_create_flair_system.sql
   
   # If using Supabase CLI:
   supabase migration up
   
   # Or apply it directly in your Supabase dashboard
   ```

2. **Regenerate TypeScript Types** ⚠️ **REQUIRED**
   After running the migration, you MUST regenerate your database types to fix TypeScript errors:
   ```bash
   npm run gen-db-types
   ```
   
   **Important**: The Flair hooks and components will show TypeScript errors until you regenerate the types. This is expected and will be resolved after running the command above.

3. **Set Up Storage Bucket**
   Create a storage bucket for Flair emotes:
   - Go to Supabase Dashboard > Storage
   - Create a new bucket named `flair-emotes`
   - Set it to public (or configure RLS policies as needed)

## Features

### Core Features
- **User Profiles**: Customize display names, PFPs, and banners
- **Emote Management**: Upload and manage custom emotes (static and animated)
- **Emote Sets**: Create emote sets for specific channels (Twitch, YouTube, Discord)
- **Profile Themes**: Apply custom themes to profiles
- **Subscription Management**: Free and Premium tiers

### Premium Features
- Unlimited emotes (free tier: 1 emote)
- Animated display names (glow, pulse, scroll, gradient, rainbow)
- Gradient effects for names
- Exclusive profile themes
- Priority support

## Database Tables

### `flair_profiles`
Stores user profile customization data including:
- Custom display names
- Display name animations
- Gradient configurations
- PFP and banner URLs
- Theme associations

### `flair_emotes`
Stores custom emotes uploaded by users:
- Static and animated emotes
- Public/private visibility
- Premium flag
- Usage tracking

### `flair_emote_sets`
Stores emote sets for channels:
- Channel name and type (Twitch, YouTube, Discord)
- Associated emote IDs
- Active status

### `flair_profile_themes`
Stores available profile themes:
- Theme name and description
- Preview images
- Theme configuration (JSON)
- Premium flag

### `flair_subscriptions`
Tracks user subscriptions:
- Subscription tier (free/premium)
- Stripe integration fields
- Status and period tracking

## API Usage

### Hooks

The Flair system provides several React hooks:

```typescript
import {
  useFlairProfile,
  useFlairEmotes,
  useFlairEmoteSets,
  useFlairThemes,
  useFlairSubscription,
} from '@/hooks/useFlair';
```

#### `useFlairProfile(userId?)`
Manages user profile customization:
- `profile`: Current profile data
- `updateProfile(updates)`: Update profile settings
- `loading`: Loading state
- `error`: Error state

#### `useFlairEmotes(userId?)`
Manages user emotes:
- `emotes`: Array of user's emotes
- `uploadEmote(emote)`: Upload a new emote
- `deleteEmote(emoteId)`: Delete an emote
- `updateEmote(emoteId, updates)`: Update emote settings

#### `useFlairSubscription(userId?)`
Manages subscription status:
- `subscription`: Current subscription data
- `isPremium`: Boolean indicating premium status
- `checkPremium()`: Manually check premium status

## Frontend Routes

- `/flair` - Main Flair dashboard

## Database Functions

### `is_premium_user(user_id)`
Returns true if the user has an active premium subscription.

### `get_emote_limit(user_id)`
Returns the emote upload limit for a user based on their subscription tier.

## RLS Policies

All Flair tables have Row Level Security enabled:
- Users can view public content
- Users can manage their own data
- Staff can manage themes
- Premium features are enforced at the database level

## Stripe Integration

To enable premium subscriptions, you'll need to:

1. Set up Stripe webhooks
2. Configure Stripe products and prices
3. Implement payment flow in the frontend
4. Update subscription status via webhooks

The `flair_subscriptions` table includes fields for Stripe integration:
- `stripe_subscription_id`
- `stripe_customer_id`
- `status`
- `current_period_start`
- `current_period_end`

## Twitch Extension Integration

To integrate Flair with Twitch:

1. Create a Twitch Extension
2. Use the Flair API to fetch user emotes
3. Inject emotes into Twitch chat
4. Display custom display names with animations

## Next Steps

1. Run the database migration
2. Regenerate TypeScript types
3. Set up storage bucket for emotes
4. Configure Stripe (for premium features)
5. Customize themes and default settings
6. Test the Flair dashboard at `/flair`

## Support

For issues or questions, please refer to the main project documentation or contact support.

