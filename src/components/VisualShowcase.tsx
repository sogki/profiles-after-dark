"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ShowcaseItem {
  id: string;
  image_url: string;
  banner_url?: string;
  pfp_url?: string;
  title: string;
  type: string;
}

export default function VisualShowcase() {
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShowcase = useCallback(async () => {
    try {
      setLoading(true);
      const items: ShowcaseItem[] = [];

      // Fetch some profile pairs
      const { data: pairsData } = await supabase
        .from("profile_pairs")
        .select("id, banner_url, pfp_url, title")
        .not("banner_url", "is", null)
        .limit(6);

      if (pairsData) {
        pairsData.forEach((item) => {
          items.push({
            id: item.id,
            banner_url: item.banner_url,
            pfp_url: item.pfp_url,
            image_url: item.banner_url || item.pfp_url || "",
            title: item.title || "Profile",
            type: "pair",
          });
        });
      }

      // Fetch some single profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, image_url, title, type")
        .not("image_url", "is", null)
        .limit(6);

      if (profilesData) {
        profilesData.forEach((item) => {
          items.push({
            id: item.id,
            image_url: item.image_url || "",
            title: item.title || "Profile",
            type: item.type || "profile",
          });
        });
      }

      // Shuffle and take 8 items
      const shuffled = items.sort(() => Math.random() - 0.5);
      setShowcaseItems(shuffled.slice(0, 8));
    } catch (error) {
      console.error("Failed to fetch showcase items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShowcase();
  }, [fetchShowcase]);

  if (loading) {
    return null;
  }

  if (showcaseItems.length === 0) {
    return null;
  }


  return (
    <section className="w-full py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Creative Showcase
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A glimpse into our vibrant collection of aesthetic profiles
          </p>
        </motion.div>

        {/* Creative Masonry Grid - Tighter spacing */}
        <div className="columns-2 md:columns-3 lg:columns-4 mb-12" style={{ columnGap: '0.5rem' }}>
          {showcaseItems.slice(0, 8).map((item, index) => {
            // Varying heights for masonry effect
            const heights = [280, 320, 240, 360, 300, 280, 340, 260];
            const height = heights[index] || 280;
            const isPair = item.type === "pair" && item.banner_url && item.pfp_url;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="break-inside-avoid mb-2 group relative overflow-hidden rounded-xl cursor-pointer"
                style={{ height: `${height}px` }}
                whileHover={{ scale: 1.02 }}
              >
                {isPair ? (
                  // Profile Pair - Show as integrated design
                  <div className="relative w-full h-full">
                    {/* Banner background */}
                    <img
                      src={item.banner_url || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* PFP integrated in top-right corner like a badge */}
                    <div className="absolute top-3 right-3 z-20">
                      <div className="relative">
                        <div className="absolute inset-0 bg-black/40 rounded-full blur-md" />
                        <img
                          src={item.pfp_url}
                          alt={`${item.title} profile`}
                          className="relative w-14 h-14 rounded-full border-2 border-white/30 group-hover:border-white/60 transition-all duration-300 shadow-xl"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      <p className="text-white font-semibold text-sm truncate drop-shadow-lg">{item.title}</p>
                    </div>
                  </div>
                ) : (
                  // Single profile - Full image
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                    <img
                      src={item.image_url || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      <p className="text-white font-semibold text-sm truncate drop-shadow-lg">{item.title}</p>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <Link
            to="/trending"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            Explore All Collections
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

