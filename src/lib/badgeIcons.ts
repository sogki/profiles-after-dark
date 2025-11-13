/**
 * Badge Icon Generator
 * 
 * Generates SVG icons for badges using react-icons
 */

import React from 'react';
import {
  // Font Awesome
  FaUpload,
  FaCheckCircle,
  FaImage,
  FaTrophy,
  FaDownload,
  FaFire,
  FaChartLine,
  FaBolt,
  FaHeart,
  FaStar,
  FaUserPlus,
  FaUser,
  FaUsers,
  FaHandshake,
  FaCrown,
  FaCalendar,
  FaClock,
  FaMedal,
  FaBirthdayCake,
  FaBug,
  FaCheckCircle,
  FaUserTie,
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';
import { MdFavorite } from 'react-icons/md';

export interface BadgeIconConfig {
  code: string;
  name: string;
  category: 'content' | 'social' | 'milestone' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// Discord-inspired dark aesthetic colors
const rarityColors = {
  common: { 
    bg: '#36393F', 
    bg2: '#40444B',
    border: '#4F545C', 
    glow: '#4F545C',
    name: 'Common',
    description: 'Basic achievement'
  },
  uncommon: { 
    bg: '#3C4146', 
    bg2: '#4A5058',
    border: '#5D6269', 
    glow: '#5D6269',
    name: 'Uncommon',
    description: 'Notable achievement'
  },
  rare: { 
    bg: '#2C2F33', 
    bg2: '#3A3E44',
    border: '#5865F2', 
    glow: '#5865F2',
    name: 'Rare',
    description: 'Impressive achievement'
  },
  epic: { 
    bg: '#2C2F33', 
    bg2: '#3A3E44',
    border: '#9C84EF', 
    glow: '#9C84EF',
    name: 'Epic',
    description: 'Exceptional achievement'
  },
  legendary: { 
    bg: '#2C2F33', 
    bg2: '#3A3E44',
    border: '#FEE75C', 
    glow: '#FEE75C',
    name: 'Legendary',
    description: 'Ultimate achievement'
  },
};

// Badge icon components from react-icons
const badgeIcons: Record<string, React.ComponentType<any>> = {
  // Content badges
  first_upload: FaUpload,
  first_approved: FaCheckCircle,
  content_creator_10: FaImage,
  content_creator_50: FaImage,
  content_creator_100: FaTrophy,
  first_download: FaDownload,
  popular_content_100: FaFire,
  popular_content_500: FaChartLine,
  viral_content: FaBolt,
  first_favorite: FaHeart,
  beloved_creator_50: MdFavorite,
  beloved_creator_200: FaHeart,
  active_downloader_10: FaDownload,
  curator_10: FaStar,
  
  // Social badges
  first_follow: FaUserPlus,
  first_follower: FaUser,
  first_mutual: FaHandshake,
  popular_10: FaStar,
  popular_50: HiSparkles,
  popular_100: FaCrown,
  
  // Milestone badges
  week_old: FaCalendar,
  month_old: FaCalendar,
  seasoned_member: FaClock,
  veteran: FaMedal,
  one_year_club: FaBirthdayCake,
  
  // Special badges
  member: FaUser,
  bug_tester: FaBug,
  verified: FaCheckCircle,
  staff: FaUserTie,
  admin: FaCrown,
};

// Fallback category icons
const categoryIcons: Record<string, React.ComponentType<any>> = {
  content: FaImage,
  social: FaUsers,
  milestone: FaTrophy,
  special: HiSparkles,
};

/**
 * Get icon component for a badge
 */
export function getBadgeIconComponent(code: string | null | undefined, category: string | null | undefined): React.ComponentType<any> {
  if (code && badgeIcons[code]) {
    return badgeIcons[code];
  }
  if (category && categoryIcons[category]) {
    return categoryIcons[category];
  }
  return categoryIcons.content;
}

/**
 * Generate SVG badge icon (for data URI generation)
 * Note: This is a simplified version. For better results, use the BadgeIcon component directly.
 */
export function generateBadgeIcon(config: BadgeIconConfig): string {
  // Return a placeholder - actual rendering should use BadgeIcon component
  // This is kept for compatibility but BadgeIcon component should be used instead
  return `/badges/${config.code}.svg`;
}

/**
 * Get badge icon URL (generates if needed, or uses stored image_url)
 */
export function getBadgeIconUrl(badge: {
  code?: string | null;
  image_url?: string | null;
  icon?: string | null;
  category?: string | null;
  rarity?: string | null;
  name?: string;
}): string {
  // If image_url or icon exists, use it
  if (badge.image_url) return badge.image_url;
  if (badge.icon) return badge.icon;
  
  // Otherwise generate SVG icon
  if (badge.code && badge.category && badge.rarity) {
    return generateBadgeIcon({
      code: badge.code,
      name: badge.name || '',
      category: badge.category as any,
      rarity: badge.rarity as any,
    });
  }
  
  // Fallback
  return '/placeholder.svg';
}

/**
 * Generate all badge icons for the migration
 */
export function getAllBadgeIcons(): Record<string, string> {
  const badges: BadgeIconConfig[] = [
    // Content badges
    { code: 'first_upload', name: 'First Steps', category: 'content', rarity: 'common' },
    { code: 'first_approved', name: 'Approved Creator', category: 'content', rarity: 'common' },
    { code: 'content_creator_10', name: 'Content Creator', category: 'content', rarity: 'uncommon' },
    { code: 'content_creator_50', name: 'Prolific Creator', category: 'content', rarity: 'rare' },
    { code: 'content_creator_100', name: 'Master Creator', category: 'content', rarity: 'epic' },
    { code: 'first_download', name: 'Downloaded!', category: 'content', rarity: 'common' },
    { code: 'popular_content_100', name: 'Popular', category: 'content', rarity: 'uncommon' },
    { code: 'popular_content_500', name: 'Trending', category: 'content', rarity: 'rare' },
    { code: 'viral_content', name: 'Viral', category: 'content', rarity: 'epic' },
    { code: 'first_favorite', name: 'Loved', category: 'content', rarity: 'common' },
    { code: 'beloved_creator_50', name: 'Beloved', category: 'content', rarity: 'uncommon' },
    { code: 'beloved_creator_200', name: 'Adored', category: 'content', rarity: 'rare' },
    { code: 'active_downloader_10', name: 'Explorer', category: 'content', rarity: 'common' },
    { code: 'curator_10', name: 'Curator', category: 'content', rarity: 'common' },
    
    // Social badges
    { code: 'first_follow', name: 'Social Butterfly', category: 'social', rarity: 'common' },
    { code: 'first_follower', name: 'Welcome!', category: 'social', rarity: 'common' },
    { code: 'first_mutual', name: 'Mutual Friends', category: 'social', rarity: 'uncommon' },
    { code: 'popular_10', name: 'Rising Star', category: 'social', rarity: 'uncommon' },
    { code: 'popular_50', name: 'Community Favorite', category: 'social', rarity: 'rare' },
    { code: 'popular_100', name: 'Influencer', category: 'social', rarity: 'epic' },
    
    // Milestone badges
    { code: 'week_old', name: 'Week Warrior', category: 'milestone', rarity: 'common' },
    { code: 'month_old', name: 'Monthly Member', category: 'milestone', rarity: 'uncommon' },
    { code: 'seasoned_member', name: 'Seasoned', category: 'milestone', rarity: 'rare' },
    { code: 'veteran', name: 'Veteran', category: 'milestone', rarity: 'epic' },
    { code: 'one_year_club', name: 'One Year Club', category: 'milestone', rarity: 'legendary' },
  ];
  
  const icons: Record<string, string> = {};
  badges.forEach(badge => {
    icons[badge.code] = generateBadgeIcon(badge);
  });
  
  return icons;
}

