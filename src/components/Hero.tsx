"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Users,
  ImageIcon,
  Layout,
  Sticker,
  Monitor,
  Upload,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import { supabase } from "../lib/supabase";

interface HeroStats {
  totalProfiles: number;
  totalDownloads: number;
  totalUsers: number;
}

interface TrendingPreviewItem {
  id: string;
  title: string;
  creator: string;
  downloadCount: number;
  previewUrl: string | null;
  subtitle: string;
  tag: string;
}

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface HeroProps {
  onAuthClick?: () => void;
}

export default function Hero({ onAuthClick }: HeroProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<HeroStats>({
    totalProfiles: 0,
    totalDownloads: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendingItems, setTrendingItems] = useState<TrendingPreviewItem[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cache results for 5 minutes
      const cacheKey = "hero_stats";
      const cached = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
      const cacheAge = cacheTimestamp
        ? Date.now() - parseInt(cacheTimestamp)
        : Infinity;

      if (cached && cacheAge < 5 * 60 * 1000) {
        setStats(JSON.parse(cached));
        setIsLoading(false);
        return;
      }

      const [pairsResponse, profilesResponse, usersResponse] =
        await Promise.all([
          supabase
            .from("profile_pairs")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("profiles")
            .select("id, download_count", { count: "exact" }),
          supabase
            .from("user_profiles")
            .select("id", { count: "exact", head: true }),
        ]);

      if (
        pairsResponse.error ||
        profilesResponse.error ||
        usersResponse.error
      ) {
        throw new Error("Failed to fetch stats");
      }

      const totalProfiles =
        (pairsResponse.count || 0) + (profilesResponse.count || 0);
      const totalDownloads =
        profilesResponse.data?.reduce(
          (sum, profile) => sum + (profile.download_count || 0),
          0
        ) || 0;
      const totalUsers = usersResponse.count || 0;

      const newStats = { totalProfiles, totalDownloads, totalUsers };
      setStats(newStats);
      localStorage.setItem(cacheKey, JSON.stringify(newStats));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
    } catch (err) {
      setError("Failed to load statistics. Please try again later.");
      console.error("Failed to fetch stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTrendingPreview = useCallback(async () => {
    try {
      // Pull from all uploaded content, not week-limited.
      // Try approved-first where available, then fallback to any status.
      const [profilesApproved, pairsApproved] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, title, user_id, download_count, updated_at, created_at, image_url, type, category, tags"
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(60),
        supabase
          .from("profile_pairs")
          .select(
            "id, title, user_id, download_count, updated_at, created_at, pfp_url, banner_url, category, tags"
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(60),
      ]);

      let profilesData = profilesApproved.data || [];
      let pairsData = pairsApproved.data || [];

      if (profilesData.length === 0) {
        const { data } = await supabase
          .from("profiles")
          .select(
            "id, title, user_id, download_count, updated_at, created_at, image_url, type, category, tags"
          )
          .order("created_at", { ascending: false })
          .limit(60);
        profilesData = data || [];
      }

      if (pairsData.length === 0) {
        const { data } = await supabase
          .from("profile_pairs")
          .select(
            "id, title, user_id, download_count, updated_at, created_at, pfp_url, banner_url, category, tags"
          )
          .order("created_at", { ascending: false })
          .limit(60);
        pairsData = data || [];
      }

      const combined = [...profilesData, ...pairsData];
      if (combined.length === 0) {
        setTrendingItems([]);
        return;
      }

      const userIds = Array.from(
        new Set(combined.map((item) => item.user_id).filter(Boolean))
      ) as string[];

      const { data: userProfiles } = userIds.length
        ? await supabase
            .from("user_profiles")
            .select("user_id, username, display_name")
            .in("user_id", userIds)
        : { data: [] as any[] };

      const userMap = new Map(
        (userProfiles || []).map((profile: any) => [profile.user_id, profile])
      );

      const normalized = combined
        .map((item: any) => {
          const userProfile = userMap.get(item.user_id);
          const creator =
            userProfile?.username || userProfile?.display_name || "Unknown user";

          const isPair = Boolean(item.pfp_url || item.banner_url);
          const previewUrl = isPair
            ? item.banner_url || item.pfp_url || null
            : item.image_url || null;

          const subtitle = isPair
            ? "Profile pair"
            : item.type === "banner"
            ? "Banner"
            : item.type === "profile"
            ? "PFP"
            : "Profile";

          const firstTag = Array.isArray(item.tags) && item.tags.length > 0
            ? `#${item.tags[0]}`
            : item.category
            ? `#${String(item.category).toLowerCase()}`
            : "#trending";

          return {
            id: item.id,
            title: item.title || "Untitled upload",
            creator,
            downloadCount: item.download_count || 0,
            previewUrl,
            subtitle,
            tag: firstTag,
            updatedAt: item.updated_at || item.created_at,
          };
        })
        .filter((item) => Boolean(item.previewUrl))
        .sort((a, b) => {
          if (b.downloadCount !== a.downloadCount) {
            return b.downloadCount - a.downloadCount;
          }
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
        .slice(0, 10)
        .map(({ updatedAt, ...rest }) => rest);

      setTrendingItems(normalized);
    } catch (err) {
      console.error("Failed to fetch hero trending preview:", err);
      setTrendingItems([]);
    }
  }, []);


  useEffect(() => {
    fetchStats();
    fetchTrendingPreview();
  }, [fetchStats, fetchTrendingPreview]);


  const scrollToGallery = () => {
    // Scroll to QuickCategories section
    const categoriesElement = document.querySelector("[data-categories]");
    if (categoriesElement) {
      categoriesElement.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Fallback: navigate to trending page
      window.location.href = "/trending";
    }
  };

  const leftColumnItems = trendingItems.filter((_, index) => index % 2 === 0);
  let rightColumnItems = trendingItems.filter((_, index) => index % 2 === 1);
  if (rightColumnItems.length === 0 && trendingItems.length > 1) {
    // Ensure right column has different items when possible.
    rightColumnItems = trendingItems.slice(1);
  }

  const buildLoop = (items: TrendingPreviewItem[]) => {
    if (items.length === 0) return [];
    const expanded = [...items];
    let guard = 0;
    while (expanded.length < 6 && guard < 6) {
      expanded.push(...items);
      guard += 1;
    }
    return [...expanded, ...expanded];
  };

  const leftLoop = buildLoop(leftColumnItems);
  const rightLoop = buildLoop(rightColumnItems);

  return (
    <section className="relative overflow-hidden bg-slate-950">
      {/* Hero-specific glow accents (intentional brand-forward spotlight) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full bg-purple-500/18 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-24 right-[12%] w-[28rem] h-[28rem] rounded-full bg-blue-500/14 blur-3xl animate-pulse"
          style={{ animationDelay: "700ms" }}
        />
        <div
          className="absolute top-[18%] left-[10%] w-72 h-72 rounded-full bg-pink-500/12 blur-3xl animate-pulse"
          style={{ animationDelay: "1200ms" }}
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center lg:justify-start mb-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/35 bg-slate-900/70 px-4 py-2 text-xs sm:text-sm font-semibold text-purple-200 shadow-[0_0_20px_rgba(139,92,246,0.24)]">
              <Sparkles className="h-4 w-4" />
              Discover your profile aesthetics
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 max-w-3xl leading-tight"
          >
            Build your
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(139,92,246,0.38)]">
              {" "}entire profile vibe
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg sm:text-xl text-slate-300 mb-6 max-w-2xl leading-relaxed"
          >
            Discover ready-to-use profile pictures, banners, profile combos, emotes, and wallpapers curated for Discord, socials, and creator identities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8"
          >
            {[
              { icon: Users, label: "Profiles" },
              { icon: ImageIcon, label: "PFPs" },
              { icon: Layout, label: "Banners" },
              { icon: Sticker, label: "Emotes" },
              { icon: Monitor, label: "Wallpapers" },
              { icon: Sparkles, label: "Emoji Combos" },
            ].map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-600/60 bg-slate-800/75 px-3 py-1.5 text-xs font-medium text-slate-200"
              >
                <item.icon className="h-3.5 w-3.5 text-purple-300" />
                {item.label}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
          >
            <button
              onClick={scrollToGallery}
              className="group btn-flat-primary inline-flex items-center gap-2 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-[0_0_28px_rgba(139,92,246,0.32)] hover:shadow-[0_0_34px_rgba(99,102,241,0.42)]"
              aria-label="Explore gallery"
            >
              <Sparkles className="h-5 w-5" />
              Explore Collections
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>


            <AnimatePresence>
              {!user && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={onAuthClick}
                  className="inline-flex items-center gap-2 btn-flat-secondary text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-200 hover:scale-[1.02] border-purple-500/35 hover:border-purple-400/45"
                  aria-label="Join community"
                >
                  <Upload className="h-5 w-5" />
                  Start Uploading
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-center lg:text-left"
              role="alert"
            >
              {error}
            </motion.div>
          )}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.35 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-purple-500/15 via-blue-500/10 to-pink-500/15 blur-2xl" />
            <div className="relative surface-elevated rounded-3xl p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-200">Trending This Week</p>
                <span className="text-xs text-slate-400">Live curation</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative h-[25rem] overflow-hidden rounded-2xl border border-purple-400/30 bg-slate-900/80">
                  {leftLoop.length > 0 ? (
                    <div className="flair-marquee-up p-3">
                      {leftLoop.map((item, idx) => (
                        <article
                          key={`main-up-${item.id}-${idx}`}
                          className="group rounded-2xl border border-purple-400/35 bg-slate-900/85 p-3 mb-3 transition-transform duration-200 hover:-translate-y-0.5"
                        >
                          <div className="w-full rounded-xl h-32 border border-white/10 mb-3 overflow-hidden bg-slate-800">
                            {item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500/30 via-fuchsia-500/20 to-blue-500/25" />
                            )}
                          </div>
                          <p className="text-white text-sm font-semibold truncate">{item.title}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{item.subtitle}</p>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-purple-300">{item.tag}</span>
                            <span className="text-slate-500">Trending</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 truncate">by {item.creator}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-slate-500 px-4 text-center">
                      No trending content this week yet.
                    </div>
                  )}
                </div>

                <div className="relative h-[25rem] overflow-hidden rounded-2xl border border-pink-400/30 bg-slate-900/80">
                  {rightLoop.length > 0 ? (
                    <div className="flair-marquee-down p-3">
                      {rightLoop.map((item, idx) => (
                        <article
                          key={`main-down-${item.id}-${idx}`}
                          className="group rounded-2xl border border-pink-400/35 bg-slate-900/85 p-3 mb-3 transition-transform duration-200 hover:-translate-y-0.5"
                        >
                          <div className="w-full rounded-xl h-32 border border-white/10 mb-3 overflow-hidden bg-slate-800">
                            {item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-pink-500/30 via-purple-500/20 to-rose-500/20" />
                            )}
                          </div>
                          <p className="text-white text-sm font-semibold truncate">{item.title}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{item.subtitle}</p>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-pink-300">{item.tag}</span>
                            <span className="text-slate-500">Trending</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 truncate">by {item.creator}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-slate-500 px-4 text-center">
                      New uploads will appear here automatically.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {!error && (
          <motion.div
            variants={statVariants}
            initial="hidden"
            animate="visible"
            className="mt-16 sm:mt-20"
          >
            <div className="mx-auto max-w-3xl rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-2">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: ImageIcon, label: "Profiles", value: stats.totalProfiles, iconColor: "text-purple-300" },
                  { icon: Download, label: "Downloads", value: stats.totalDownloads, iconColor: "text-blue-300" },
                  { icon: Users, label: "Members", value: stats.totalUsers, iconColor: "text-green-300" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-center gap-1.5 rounded-full px-2 py-1">
                    <stat.icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
                    {isLoading ? (
                      <span className="inline-block h-3 w-10 animate-pulse rounded bg-slate-700/60" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-100">
                        {stat.value.toLocaleString()}
                      </span>
                    )}
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
