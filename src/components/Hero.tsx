"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Users,
  ImageIcon,
  ArrowRight,
  Sparkles,
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


  useEffect(() => {
    fetchStats();
  }, [fetchStats]);


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
    <section className="relative overflow-hidden" style={{ zIndex: 1 }}>
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets/hero-background.png)', filter: 'blur(4px)' }}></div>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20 relative z-10">
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
                  className="bg-[rgba(30,20,60,0.3)] backdrop-blur-md rounded-2xl p-6 border border-purple-600/40 hover:border-purple-500/60 transition-all duration-300 shadow-lg shadow-purple-900/30 relative z-10"
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
