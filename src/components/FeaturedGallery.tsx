"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Download, Eye, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ProfilePair {
  id: string;
  title: string;
  category: string;
  pfp_url: string;
  banner_url: string;
  download_count?: number;
  type: "pair";
}

interface Profile {
  id: string;
  title: string;
  category: string;
  image_url: string;
  download_count: number;
  type: string;
}

type GalleryItem = ProfilePair | Profile;

export default function FeaturedGallery() {
  const [featuredItems, setFeaturedItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatured = useCallback(async () => {
    try {
      setLoading(true);
      const allItems: GalleryItem[] = [];

      // Fetch top profile pairs by download count (only approved)
      const { data: pairsData } = await supabase
        .from("profile_pairs")
        .select("*")
        .eq("status", "approved")
        .order("download_count", { ascending: false })
        .limit(3);

      if (pairsData) {
        pairsData.forEach((item) => {
          allItems.push({
            id: item.id,
            title: item.title || "Untitled",
            category: item.category || "General",
            pfp_url: item.pfp_url || "",
            banner_url: item.banner_url || "",
            download_count: item.download_count || 0,
            type: "pair" as const,
          });
        });
      }

      // Fetch top profiles by download count (only approved)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .eq("status", "approved")
        .order("download_count", { ascending: false })
        .limit(3);

      if (profilesData) {
        profilesData.forEach((item) => {
          allItems.push({
            id: item.id,
            title: item.title || "Untitled",
            category: item.category || "General",
            image_url: item.image_url || "",
            download_count: item.download_count || 0,
            type: item.type || "profile",
          });
        });
      }

      // Sort by download count and take top 6
      allItems.sort((a, b) => {
        const countA = "download_count" in a ? a.download_count || 0 : 0;
        const countB = "download_count" in b ? b.download_count || 0 : 0;
        return countB - countA;
      });

      setFeaturedItems(allItems.slice(0, 6));
    } catch (error) {
      console.error("Failed to fetch featured items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  const getImageUrl = (item: GalleryItem) => {
    if ("pfp_url" in item && item.type === "pair") {
      return item.banner_url || item.pfp_url;
    } else if ("image_url" in item) {
      return item.image_url;
    }
    return "";
  };

  if (loading) {
    return (
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-800/50 rounded-2xl h-64 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featuredItems.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Popular This Week
            </h2>
            <p className="text-lg text-slate-400">
              Discover the most downloaded content from our community
            </p>
          </div>
          <Link
            to="/trending"
            className="hidden sm:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            View All
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={getImageUrl(item) || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                
                {"pfp_url" in item && item.type === "pair" && item.pfp_url && (
                  <img
                    src={item.pfp_url}
                    alt={`${item.title} profile`}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full border-4 border-purple-500 bg-slate-900"
                    loading="lazy"
                  />
                )}
              </div>

              <div className="p-6">
                <h3 className="text-white font-semibold mb-2 line-clamp-1 group-hover:text-purple-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4 capitalize">
                  {item.category}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Download className="h-4 w-4 text-green-400" />
                    <span>
                      {("download_count" in item ? item.download_count : 0) || 0}
                    </span>
                  </div>
                  <Link
                    to={`/gallery/${item.type === "pair" ? "profiles" : item.type}`}
                    className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    View
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link
            to="/trending"
            className="sm:hidden inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            <Sparkles className="h-5 w-5" />
            Explore Trending Content
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

