import React from 'react';
import { getBadgeIconComponent } from '@/lib/badgeIcons';

interface BadgeIconProps {
  code?: string | null;
  category?: string | null;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | null;
  size?: number;
  className?: string;
}

export default function BadgeIcon({ code, category, rarity, size = 128, className = '' }: BadgeIconProps) {
  // Fallback values if missing
  const badgeCode = code || 'unknown';
  const badgeCategory = category || 'content';
  
  const IconComponent = getBadgeIconComponent(badgeCode, badgeCategory);
  const iconSize = size * 0.6; // Larger icon since no background

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Simple purple border circle */}
      <div
        className="absolute inset-0 rounded-full border-2 border-purple-500"
        style={{ 
          width: size, 
          height: size,
        }}
      />
      
      {/* Icon in the center */}
      <IconComponent 
        size={iconSize} 
        className="relative z-10 text-white"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} 
      />
    </div>
  );
}
