"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Users,
  ImageIcon,
  ArrowRight,
  Sparkles,
  Star,
  Heart,
  Eye,
  Upload,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import { supabase } from "../lib/supabase";

interface HeroStats {
  totalProfiles: number;
  totalDownloads: number;
  totalUsers: number;
}

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Hero() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HeroStats>({
    totalProfiles: 0,
    totalDownloads: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredProfiles, setFeaturedProfiles] = useState<any[]>([]);

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

  const fetchFeaturedProfiles = useCallback(async () => {
    try {
      // First try to get admin-selected featured profiles
      const { data: featuredProfiles, error: featuredError } = await supabase
        .from("profiles")
        .select("id, title, image_url, download_count, category, tags, is_featured")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (featuredError) {
        console.warn("Featured profiles table might not have is_featured column:", featuredError);
        // Fallback to most downloaded profiles if featured column doesn't exist
        const { data: fallbackProfiles, error: fallbackError } = await supabase
          .from("profiles")
          .select("id, title, image_url, download_count, category, tags")
          .order("download_count", { ascending: false })
          .limit(3);

        if (fallbackError) throw fallbackError;
        setFeaturedProfiles(fallbackProfiles || []);
      } else {
        setFeaturedProfiles(featuredProfiles || []);
      }
    } catch (err) {
      console.error("Failed to fetch featured profiles:", err);
      // Set empty array on error to prevent crashes
      setFeaturedProfiles([]);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchFeaturedProfiles();
  }, [fetchStats, fetchFeaturedProfiles]);


  const scrollToGallery = () => {
    const galleryElement =
      document.querySelector("[data-gallery]") ||
      document.querySelector(".profiles-gallery") ||
      document.querySelector("main");

    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/gallery";
    }
  };

  return (
    <section className="relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets/hero-background.png)', zIndex: 1 }}>
      <div className="absolute inset-0 bg-black/40 z-0"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300" />
              <img
                src="https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles-after-dark-logomark.png"
                alt="Profiles After Dark"
                className="relative h-12 sm:h-16 transition-transform duration-300 group-hover:scale-105"
                loading="eager"
              />
            </div>
          </motion.div>


          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            Discover and download stunning aesthetic profile pictures and
            banners for all your favourite social media platforms.
          </motion.p>


          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16 sm:mb-20"
          >
            <button
              onClick={scrollToGallery}
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              aria-label="Explore gallery"
            >
              <Sparkles className="h-5 w-5" />
              Explore Gallery
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>


            <AnimatePresence>
              {!user && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/25"
                  aria-label="Join community"
                >
                  <Users className="h-5 w-5" />
                  Join Community
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Featured Profiles Preview - Bleeding into next section */}
          {featuredProfiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="absolute -bottom-60 left-0 right-0 w-full"
            style={{ zIndex: 999999 }}
          >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h3 className="text-2xl font-bold text-white mb-8 text-center relative" style={{ zIndex: 1000000 }}>
                  Featured Profiles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto relative" style={{ zIndex: 1000000 }}>
                  {featuredProfiles.map((profile, index) => (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="group bg-slate-800/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-600/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer shadow-2xl relative"
                      style={{ zIndex: 1000000 + index }}
                      onClick={scrollToGallery}
                    >
                      <div className="relative mb-4">
                        <img
                          src={profile.image_url || "/placeholder.svg"}
                          alt={profile.title}
                          className="w-full h-36 object-cover rounded-xl brightness-75 group-hover:brightness-90 transition-all duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1"
                             style={{ zIndex: 1000001 + index }}>
                          <Star className="h-3 w-3 text-yellow-400" />
                          <span className="text-xs text-white font-medium">
                            {profile.download_count || 0}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-white font-semibold text-sm mb-2 truncate">
                        {profile.title}
                      </h4>
                      <p className="text-slate-400 text-xs capitalize">
                        {profile.category}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-center mb-8"
              role="alert"
            >
              {error}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20 relative z-20">
              {[
                {
                  icon: ImageIcon,
                  color: "purple-blue",
                  label: "Total Profiles",
                  value: stats.totalProfiles,
                },
                {
                  icon: Download,
                  color: "purple-blue",
                  label: "Downloads",
                  value: stats.totalDownloads,
                },
                {
                  icon: Users,
                  color: "purple-blue",
                  label: "Community Members",
                  value: stats.totalUsers,
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={statVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.2 }}
                  className="bg-[rgba(30,20,60,0.3)] backdrop-blur-md rounded-2xl p-6 border border-purple-600/40 hover:border-purple-500/60 transition-all duration-300 shadow-lg shadow-purple-900/30 relative z-30"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-700/30 to-blue-500/30 rounded-full">
                      <stat.icon className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {isLoading ? (
                      <div className="h-8 w-24 mx-auto bg-purple-700/50 animate-pulse rounded" />
                    ) : (
                      stat.value.toLocaleString()
                    )}
                  </div>
                  <div className="text-purple-300 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          )}

          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4 sm:gap-6"
          >
            {[
              {
                icon: ImageIcon,
                text: "Express yourself",
              },
              {
                icon: Download,
                text: "Empower creativity",
              },
              {
                icon: Users,
                text: "Vibrant community",
              },
            ].map((feature) => (
              <div
                key={feature.text}
                className="flex items-center space-x-3 bg-[rgba(30,20,60,0.25)] backdrop-blur-md rounded-xl px-6 py-4 border border-purple-600/40 hover:border-purple-500/60 transition-all duration-300 group shadow-md shadow-purple-900/30"
              >
                <div className="p-2 bg-gradient-to-br from-purple-700/30 to-blue-500/30 rounded-lg group-hover:from-purple-700/50 group-hover:to-blue-500/50 transition-colors">
                  <feature.icon className="h-5 w-5 text-purple-400" />
                </div>
                <span className="text-white font-medium text-sm sm:text-base">
                  {feature.text}
                </span>
              </div>
            ))}
          </motion.div> */}

        </div>
      </div>
    </section>
  );
}
