# 🏆 Achievements/Badges System

A comprehensive gamification system that rewards users for engaging with the platform through achievements and badges.

## Overview

The achievements system automatically tracks user actions and awards badges when milestones are reached. This encourages user engagement, guides new users through onboarding, and creates a sense of accomplishment.

## Features

### ✅ Automatic Badge Unlocking
- Badges are automatically awarded when users complete specific actions
- Triggers monitor key events (content uploads, follows, approvals)
- No manual intervention required

### 🎯 Achievement Categories

1. **Content Achievements**
   - First Upload
   - First Approved Content
   - Content Creator (10, 50, 100 approved pieces)

2. **Social Achievements**
   - First Follow
   - First Follower
   - First Mutual Friend
   - Popular (10, 50, 100 followers)

### 🎨 Badge Rarity System

Badges are categorized by rarity:
- **Common** - Easy to obtain, basic milestones
- **Uncommon** - Moderate achievements
- **Rare** - Significant accomplishments
- **Epic** - Major milestones
- **Legendary** - Exceptional achievements

### 🔔 Notifications

Users receive notifications when they unlock badges, making the achievement feel rewarding and encouraging further engagement.

## Database Schema

### `badges` Table
- `id` - Unique identifier
- `code` - Unique code for programmatic access (e.g., 'first_upload')
- `name` - Display name
- `description` - What the badge represents
- `image_url` - Badge icon/image
- `category` - content, social, milestone, special
- `rarity` - common, uncommon, rare, epic, legendary
- `is_active` - Whether badge can be earned

### `user_badges` Table
- `id` - Unique identifier
- `user_id` - Reference to user
- `badge_id` - Reference to badge
- `unlocked_at` - When the badge was earned
- `metadata` - Optional JSON metadata

## Usage

### Frontend

```typescript
import { getUserBadges, checkAchievements, getAllBadges } from '@/lib/achievements';

// Get user's badges
const badges = await getUserBadges(userId);

// Manually trigger achievement check
await checkAchievements();

// Get all available badges
const allBadges = await getAllBadges();
```

### Backend Functions

#### `award_badge(user_id, badge_code, metadata)`
Manually award a badge to a user (typically used by staff).

#### `check_all_achievements(user_id)`
Check all achievement types for a user and award any that are earned.

#### `check_content_achievements(user_id)`
Check content-related achievements only.

#### `check_social_achievements(user_id)`
Check social-related achievements only.

## Automatic Triggers

The system automatically checks achievements when:

1. **Content Uploads**
   - New profile uploaded
   - New profile pair uploaded
   - New emote uploaded
   - New wallpaper uploaded
   - New emoji combo uploaded

2. **Content Approval**
   - Content status changes to 'approved'

3. **Social Actions**
   - User follows another user

## Adding New Badges

To add a new badge:

1. Insert into `badges` table:
```sql
INSERT INTO badges (code, name, description, image_url, category, rarity)
VALUES (
  'new_badge_code',
  'New Badge Name',
  'Description of what this badge is for',
  'https://example.com/badge-icon.png',
  'content', -- or 'social', 'milestone', 'special'
  'common' -- or 'uncommon', 'rare', 'epic', 'legendary'
);
```

2. Add logic to check for the badge in the appropriate function:
   - `check_content_achievements()` for content badges
   - `check_social_achievements()` for social badges
   - Or create a new function for other categories

3. Add trigger if needed for automatic checking

## Badge Display

Badges are automatically displayed on user profiles (already implemented in `UserProfile.tsx`). The system queries `user_badges` with the `badges` relation to show all earned badges.

## Benefits

1. **User Engagement** - Encourages users to explore features
2. **Retention** - Gives users goals to work towards
3. **Onboarding** - Guides new users through key actions
4. **Social Status** - Badges create visible accomplishments
5. **Gamification** - Makes the platform more fun and interactive

## Future Enhancements

Potential additions:
- Badge collections/themes
- Seasonal/limited-time badges
- Badge progress tracking (e.g., "5/10 uploads")
- Badge showcase on profile
- Leaderboards for badge collectors
- Badge trading (if desired)

