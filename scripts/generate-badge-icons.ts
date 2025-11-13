/**
 * Script to generate badge icon SVG files
 * 
 * Run with: npx tsx scripts/generate-badge-icons.ts
 * 
 * This will generate SVG files in public/badges/ directory
 */

import * as fs from 'fs';
import * as path from 'path';

interface BadgeConfig {
  code: string;
  name: string;
  category: 'content' | 'social' | 'milestone' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  emoji: string;
}

const rarityColors = {
  common: { bg: '#475569', bg2: '#64748B', border: '#94A3B8', glow: '#94A3B8' },
  uncommon: { bg: '#059669', bg2: '#10B981', border: '#34D399', glow: '#10B981' },
  rare: { bg: '#2563EB', bg2: '#3B82F6', border: '#60A5FA', glow: '#3B82F6' },
  epic: { bg: '#7C3AED', bg2: '#8B5CF6', border: '#A78BFA', glow: '#8B5CF6' },
  legendary: { bg: '#D97706', bg2: '#F59E0B', border: '#FBBF24', glow: '#FCD34D' },
};

// Import the icon paths from the main file (we'll use the same structure)
const badgeIconPaths: Record<string, string> = {
  first_upload: 'M12 4v16m8-8H4',
  first_approved: 'M5 13l4 4L19 7',
  content_creator_10: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  content_creator_50: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  content_creator_100: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  first_download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  popular_content_100: 'M13 10V3L4 14h7v7l9-11h-7z',
  popular_content_500: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  viral_content: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  first_favorite: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  beloved_creator_50: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  beloved_creator_200: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  active_downloader_10: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  curator_10: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  first_follow: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  first_follower: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  first_mutual: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  popular_10: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  popular_50: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  popular_100: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  week_old: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  month_old: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  seasoned_member: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  veteran: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  one_year_club: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
};

const badges: BadgeConfig[] = [
  // Content badges
  { code: 'first_upload', name: 'First Steps', category: 'content', rarity: 'common', emoji: '' },
  { code: 'first_approved', name: 'Approved Creator', category: 'content', rarity: 'common', emoji: '' },
  { code: 'content_creator_10', name: 'Content Creator', category: 'content', rarity: 'uncommon', emoji: '' },
  { code: 'content_creator_50', name: 'Prolific Creator', category: 'content', rarity: 'rare', emoji: '' },
  { code: 'content_creator_100', name: 'Master Creator', category: 'content', rarity: 'epic', emoji: '' },
  { code: 'first_download', name: 'Downloaded!', category: 'content', rarity: 'common', emoji: '' },
  { code: 'popular_content_100', name: 'Popular', category: 'content', rarity: 'uncommon', emoji: '' },
  { code: 'popular_content_500', name: 'Trending', category: 'content', rarity: 'rare', emoji: '' },
  { code: 'viral_content', name: 'Viral', category: 'content', rarity: 'epic', emoji: '' },
  { code: 'first_favorite', name: 'Loved', category: 'content', rarity: 'common', emoji: '' },
  { code: 'beloved_creator_50', name: 'Beloved', category: 'content', rarity: 'uncommon', emoji: '' },
  { code: 'beloved_creator_200', name: 'Adored', category: 'content', rarity: 'rare', emoji: '' },
  { code: 'active_downloader_10', name: 'Explorer', category: 'content', rarity: 'common', emoji: '' },
  { code: 'curator_10', name: 'Curator', category: 'content', rarity: 'common', emoji: '' },
  
  // Social badges
  { code: 'first_follow', name: 'Social Butterfly', category: 'social', rarity: 'common', emoji: '' },
  { code: 'first_follower', name: 'Welcome!', category: 'social', rarity: 'common', emoji: '' },
  { code: 'first_mutual', name: 'Mutual Friends', category: 'social', rarity: 'uncommon', emoji: '' },
  { code: 'popular_10', name: 'Rising Star', category: 'social', rarity: 'uncommon', emoji: '' },
  { code: 'popular_50', name: 'Community Favorite', category: 'social', rarity: 'rare', emoji: '' },
  { code: 'popular_100', name: 'Influencer', category: 'social', rarity: 'epic', emoji: '' },
  
  // Milestone badges
  { code: 'week_old', name: 'Week Warrior', category: 'milestone', rarity: 'common', emoji: '' },
  { code: 'month_old', name: 'Monthly Member', category: 'milestone', rarity: 'uncommon', emoji: '' },
  { code: 'seasoned_member', name: 'Seasoned', category: 'milestone', rarity: 'rare', emoji: '' },
  { code: 'veteran', name: 'Veteran', category: 'milestone', rarity: 'epic', emoji: '' },
  { code: 'one_year_club', name: 'One Year Club', category: 'milestone', rarity: 'legendary', emoji: '' },
  
  // Special badges
  { code: 'member', name: 'Member', category: 'special', rarity: 'common', emoji: '' },
  { code: 'bug_tester', name: 'Bug Tester', category: 'special', rarity: 'rare', emoji: '' },
  { code: 'verified', name: 'Verified', category: 'special', rarity: 'epic', emoji: '' },
  { code: 'staff', name: 'Staff', category: 'special', rarity: 'epic', emoji: '' },
  { code: 'admin', name: 'Admin', category: 'special', rarity: 'legendary', emoji: '' },
];

function generateSVG(badge: BadgeConfig): string {
  const colors = rarityColors[badge.rarity];
  const hasGlow = badge.rarity === 'epic' || badge.rarity === 'legendary';
  const iconPath = badgeIconPaths[badge.code] || 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Main gradient background -->
    <linearGradient id="bg-${badge.code}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
      <stop offset="30%" style="stop-color:${colors.bg2 || colors.bg};stop-opacity:1" />
      <stop offset="70%" style="stop-color:${colors.border};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.bg};stop-opacity:1" />
    </linearGradient>
    
    <!-- Radial gradient for depth -->
    <radialGradient id="radial-${badge.code}" cx="50%" cy="30%" r="70%">
      <stop offset="0%" style="stop-color:${colors.border};stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:${colors.bg};stop-opacity:1" />
    </radialGradient>
    
    <!-- Shine effect -->
    <linearGradient id="shine-${badge.code}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.5);stop-opacity:1" />
      <stop offset="30%" style="stop-color:rgba(255,255,255,0.2);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:1" />
    </linearGradient>
    
    ${hasGlow ? `
    <!-- Premium shine for epic/legendary -->
    <linearGradient id="premium-shine-${badge.code}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.6);stop-opacity:1" />
      <stop offset="50%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.3);stop-opacity:1" />
    </linearGradient>
    
    <!-- Glow filter for epic/legendary -->
    <filter id="glow-${badge.code}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    ` : ''}
    
    <!-- Shadow filter -->
    <filter id="shadow-${badge.code}">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-opacity="0.5"/>
    </filter>
  </defs>
  
  ${hasGlow ? `
  <!-- Outer glow ring for epic/legendary -->
  <circle cx="64" cy="64" r="62" fill="none" stroke="${colors.glow}" stroke-width="3" opacity="0.4" filter="url(#glow-${badge.code})"/>
  <circle cx="64" cy="64" r="60" fill="none" stroke="${colors.border}" stroke-width="2" opacity="0.2"/>
  ` : ''}
  
  <!-- Main badge circle with premium gradient -->
  <circle cx="64" cy="64" r="56" fill="url(#bg-${badge.code})" stroke="${colors.border}" stroke-width="3" filter="url(#shadow-${badge.code})"/>
  
  <!-- Radial overlay for depth -->
  <circle cx="64" cy="64" r="56" fill="url(#radial-${badge.code})" opacity="0.7"/>
  
  <!-- Inner shadow circle -->
  <circle cx="64" cy="64" r="52" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
  
  <!-- Shine effect -->
  <circle cx="64" cy="64" r="50" fill="url(#${hasGlow ? `premium-shine-${badge.code}` : `shine-${badge.code}`})"/>
  
  <!-- Inner border highlight -->
  <circle cx="64" cy="64" r="48" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  
  ${hasGlow ? `
  <!-- Additional highlight for premium badges -->
  <ellipse cx="64" cy="40" rx="25" ry="15" fill="rgba(255,255,255,0.3)" opacity="0.8"/>
  ` : ''}
  
  <!-- Icon path -->
  <g transform="translate(64, 64) scale(2.5)">
    <path d="${iconPath}" fill="white" stroke="rgba(0,0,0,0.3)" stroke-width="0.3" opacity="0.95" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5))"/>
  </g>
  
  <!-- Rarity indicator gem with premium look -->
  <circle cx="96" cy="32" r="9" fill="${colors.glow}" ${hasGlow ? `filter="url(#glow-${badge.code})"` : ''} opacity="0.95"/>
  <circle cx="96" cy="32" r="6" fill="white" opacity="0.8"/>
  <circle cx="94" cy="30" r="2" fill="rgba(255,255,255,0.9)"/>
</svg>`;
}

function main() {
  const outputDir = path.join(process.cwd(), 'public', 'badges');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`Generating ${badges.length} badge icons...`);
  
  badges.forEach(badge => {
    const svg = generateSVG(badge);
    const filePath = path.join(outputDir, `${badge.code}.svg`);
    fs.writeFileSync(filePath, svg, 'utf-8');
    console.log(`✓ Generated ${badge.code}.svg`);
  });
  
  console.log(`\n✅ All badge icons generated in ${outputDir}/`);
  console.log(`\nYou can now update the migration to use these paths:`);
  console.log(`'/badges/${badge.code}.svg'`);
}

main();

