import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle, Lock, Users, Image, Calendar, Star, Sparkles } from 'lucide-react';
import { getAllBadges, getUserBadges, getRarityColor, type Badge, type UserBadge } from '@/lib/achievements';
import { useAuth } from '@/context/authContext';
import BadgeIcon from './BadgeIcon';

export default function BadgeShowcase() {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [user]);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const [badges, earned] = await Promise.all([
        getAllBadges(),
        user ? getUserBadges(user.id) : Promise.resolve([])
      ]);
      setAllBadges(badges);
      setUserBadges(earned);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasBadge = (badgeId: string): boolean => {
    return userBadges.some(ub => ub.badge_id === badgeId);
  };

  const getUnlockedCount = (): number => {
    return userBadges.length;
  };

  const getCategoryInfo = (category: string | null | undefined) => {
    switch (category) {
      case 'content':
        return {
          icon: Image,
          title: 'Content Creator Badges',
          description: 'Earn badges by creating and sharing content on the platform',
          color: 'text-blue-400'
        };
      case 'social':
        return {
          icon: Users,
          title: 'Social Badges',
          description: 'Connect with others and build your community presence',
          color: 'text-purple-400'
        };
      case 'milestone':
        return {
          icon: Calendar,
          title: 'Milestone Badges',
          description: 'Celebrate your journey and time spent on the platform',
          color: 'text-green-400'
        };
      case 'special':
        return {
          icon: Sparkles,
          title: 'Special Badges',
          description: 'Rare and exclusive badges for extraordinary achievements',
          color: 'text-yellow-400'
        };
      default:
        return {
          icon: Trophy,
          title: 'Other Badges',
          description: 'Additional achievements and accomplishments',
          color: 'text-slate-400'
        };
    }
  };

  // Rarity order (highest to lowest)
  const rarityOrder: Record<string, number> = {
    legendary: 5,
    epic: 4,
    rare: 3,
    uncommon: 2,
    common: 1,
  };

  // Group badges by category and sort by rarity
  const badgesByCategory = allBadges.reduce((acc, badge) => {
    const category = badge.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  // Sort badges within each category by rarity (lowest first - ascending)
  Object.keys(badgesByCategory).forEach(category => {
    badgesByCategory[category].sort((a, b) => {
      const aRarity = rarityOrder[a.rarity || 'common'] || 0;
      const bRarity = rarityOrder[b.rarity || 'common'] || 0;
      return aRarity - bRarity; // Ascending order (common first)
    });
  });

  // Define category order
  const categoryOrder = ['content', 'social', 'milestone', 'special'];
  const sortedCategories = categoryOrder.filter(cat => badgesByCategory[cat]?.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading badges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <Trophy className="w-12 h-12 text-yellow-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">Badge Showcase</h1>
          </motion.div>
          <p className="text-slate-300 text-lg mb-6 max-w-2xl mx-auto">
            Show off your achievements and unlock new badges as you explore the platform. Each badge represents a milestone in your journey.
          </p>
          {user && (
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-900 rounded-full border border-purple-600">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">
                {getUnlockedCount()} / {allBadges.length} Badges Unlocked
              </span>
            </div>
          )}
        </div>

        {/* Category Sections */}
        <div className="space-y-12">
          {sortedCategories.map((category, categoryIndex) => {
            const categoryInfo = getCategoryInfo(category);
            const CategoryIcon = categoryInfo.icon;
            const badges = badgesByCategory[category] || [];
            
            return (
              <motion.section
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
                className="space-y-6"
              >
                {/* Category Header */}
                <div className="flex items-start gap-4 pb-4 border-b border-slate-700">
                  <div className={`p-3 rounded-lg bg-slate-800 border border-slate-700 ${categoryInfo.color}`}>
                    <CategoryIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">{categoryInfo.title}</h2>
                    <p className="text-slate-400">{categoryInfo.description}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {badges.length} {badges.length === 1 ? 'badge' : 'badges'} available
                    </p>
                  </div>
                </div>

                {/* Badges Grid for this Category */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {badges.map((badge, index) => {
                    const unlocked = hasBadge(badge.id);
                    const rarity = badge.rarity || 'common';
                    
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (categoryIndex * 0.1) + (index * 0.03) }}
                        className={`relative bg-slate-800 rounded-lg p-4 border-2 transition-all ${
                          unlocked
                            ? 'border-green-600'
                            : 'border-slate-700 opacity-60'
                        }`}
                      >
                        {/* Unlocked Badge */}
                        {unlocked && (
                          <div className="absolute top-2 right-2 z-10">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>
                        )}

                        {/* Badge Image */}
                        <div className="flex justify-center mb-3">
                          <div className="relative" style={{ width: 80, height: 80 }}>
                            {unlocked ? (
                              <BadgeIcon
                                code={badge.code || badge.id}
                                category={badge.category || 'content'}
                                rarity={badge.rarity || 'common'}
                                size={80}
                              />
                            ) : (
                              <>
                                <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center shadow-2xl">
                                  <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
                                </div>
                                <BadgeIcon
                                  code={badge.code || badge.id}
                                  category={badge.category || 'content'}
                                  rarity={badge.rarity || 'common'}
                                  size={80}
                                  className="opacity-30"
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {/* Badge Info */}
                        <div className="text-center">
                          <h3 className="font-semibold text-white mb-1 text-sm">{badge.name}</h3>
                          <p className="text-xs text-slate-400 mb-2 line-clamp-2 min-h-[2.5rem]">
                            {badge.description}
                          </p>
                          <span className={`text-xs capitalize font-medium ${getRarityColor(rarity as any)}`}>
                            {rarity}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>

        {allBadges.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No badges available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

