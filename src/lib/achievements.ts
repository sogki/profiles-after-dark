/**
 * Achievements/Badges System
 * 
 * Utility functions for working with the achievements system
 */

import { supabase } from './supabase';

export interface Badge {
  id: string;
  code?: string | null;
  name: string;
  description: string;
  image_url?: string | null;
  icon?: string | null;
  category?: 'content' | 'social' | 'milestone' | 'special' | null;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at?: string | null;
}

// Helper to get badge image (prefers image_url, falls back to icon, then generates SVG)
export function getBadgeImage(badge: Badge): string {
  // If image_url or icon exists, use it
  if (badge.image_url) return badge.image_url;
  if (badge.icon) return badge.icon;
  
  // Try to use generated SVG file from public/badges/
  if (badge.code) {
    return `/badges/${badge.code}.svg`;
  }
  
  // Fallback to dynamic generation
  try {
    const { getBadgeIconUrl } = require('./badgeIcons');
    return getBadgeIconUrl(badge);
  } catch {
    return '/placeholder.svg';
  }
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
  metadata: Record<string, any>;
  badges: Badge;
}

/**
 * Get all available badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('rarity', { ascending: false });

  if (error) {
    console.error('Error fetching badges:', error);
    return [];
  }

  return data || [];
}

/**
 * Get badges for a specific user
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badges (*)
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if a user has a specific badge
 */
export async function userHasBadge(userId: string, badgeCode: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      id,
      badges!inner(code)
    `)
    .eq('user_id', userId)
    .eq('badges.code', badgeCode)
    .limit(1);

  if (error) {
    console.error('Error checking badge:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Manually trigger achievement check for current user
 * Useful for checking achievements after actions that might not have triggers
 */
export async function checkAchievements(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to check achievements');
  }

  const { error } = await supabase.rpc('check_all_achievements', {
    p_user_id: user.id
  });

  if (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
}

/**
 * Get achievement statistics for a user
 */
export async function getAchievementStats(userId: string): Promise<{
  totalBadges: number;
  badgesByCategory: Record<string, number>;
  badgesByRarity: Record<string, number>;
  recentBadges: UserBadge[];
}> {
  const badges = await getUserBadges(userId);
  
  const badgesByCategory: Record<string, number> = {};
  const badgesByRarity: Record<string, number> = {};
  
  badges.forEach((userBadge) => {
    const category = userBadge.badges.category;
    const rarity = userBadge.badges.rarity;
    
    badgesByCategory[category] = (badgesByCategory[category] || 0) + 1;
    badgesByRarity[rarity] = (badgesByRarity[rarity] || 0) + 1;
  });

  return {
    totalBadges: badges.length,
    badgesByCategory,
    badgesByRarity,
    recentBadges: badges.slice(0, 5)
  };
}

/**
 * Get rarity color for badge display
 */
export function getRarityColor(rarity: Badge['rarity']): string {
  // Discord-inspired dark aesthetic
  const colors: Record<Badge['rarity'], string> = {
    common: 'text-slate-400 border-slate-500',
    uncommon: 'text-slate-300 border-slate-400',
    rare: 'text-[#5865F2] border-[#5865F2]',
    epic: 'text-[#9C84EF] border-[#9C84EF]',
    legendary: 'text-[#FEE75C] border-[#FEE75C]'
  };
  
  return colors[rarity] || colors.common;
}

/**
 * Get rarity background color for badge display
 */
export function getRarityBgColor(rarity: Badge['rarity']): string {
  // Discord-inspired dark aesthetic
  const colors: Record<Badge['rarity'], string> = {
    common: 'bg-slate-700/30',
    uncommon: 'bg-slate-600/30',
    rare: 'bg-[#5865F2]/20',
    epic: 'bg-[#9C84EF]/20',
    legendary: 'bg-[#FEE75C]/20'
  };
  
  return colors[rarity] || colors.common;
}

