"use client";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ImageIcon,
  Layout,
  Smile,
  Sticker,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const categories = [
  {
    name: "Profile Pictures",
    icon: ImageIcon,
    path: "/gallery/pfps",
    gradient: "from-pink-500 to-rose-500",
    position: { top: "5%", left: "5%" },
  },
  {
    name: "Banners",
    icon: Layout,
    path: "/gallery/banners",
    gradient: "from-purple-500 to-indigo-500",
    position: { top: "12%", right: "8%" },
  },
  {
    name: "Emoji Combos",
    icon: Smile,
    path: "/gallery/emoji-combos",
    gradient: "from-yellow-500 to-orange-500",
    position: { bottom: "20%", left: "8%" },
  },
  {
    name: "Emotes",
    icon: Sticker,
    path: "/gallery/emotes",
    gradient: "from-blue-500 to-cyan-500",
    position: { top: "30%", right: "10%" },
  },
  {
    name: "Wallpapers",
    icon: ImageIcon,
    path: "/gallery/wallpapers",
    gradient: "from-green-500 to-emerald-500",
    position: { bottom: "10%", right: "5%" },
  },
  {
    name: "Trending",
    icon: TrendingUp,
    path: "/trending",
    gradient: "from-violet-500 to-purple-500",
    position: { bottom: "30%", left: "5%" },
  },
];

export default function QuickCategories() {
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section data-categories className="w-full py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Explore Our{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Collections
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Browse curated collections of aesthetic content for every platform
          </p>
        </motion.div>

        {/* Creative floating icon navigation */}
        <div className="relative min-h-[500px] md:min-h-[600px]">
          {/* Central text area - larger safe zone */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="w-full max-w-md px-8 text-center">
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-2xl sm:text-3xl font-bold text-white mb-2"
              >
                Choose Your Style
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-slate-400 text-lg"
              >
                Click any icon to explore
              </motion.p>
            </div>
          </div>

          {/* Floating category icons */}
          {categories.map((category, index) => {
            const pos = category.position;
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 150
                }}
                className="absolute z-10"
                style={pos}
              >
                <motion.div
                  className="group relative"
                  whileHover="hover"
                  initial="initial"
                >
                  <Link
                    to={category.path}
                    onClick={handleLinkClick}
                    className="relative block"
                  >
                    {/* Morphing circle to rectangle */}
                    <motion.div
                      variants={{
                        initial: { 
                          borderRadius: "2.5rem",
                          width: "5rem",
                          paddingLeft: 0,
                          paddingRight: 0
                        },
                        hover: { 
                          borderRadius: "0.75rem",
                          width: "14rem",
                          paddingLeft: "1rem",
                          paddingRight: "1rem"
                        }
                      }}
                      transition={{ 
                        duration: 0.4, 
                        ease: [0.4, 0, 0.2, 1],
                        borderRadius: {
                          duration: 0.4,
                          ease: [0.4, 0, 0.2, 1]
                        },
                        width: {
                          duration: 0.4,
                          ease: [0.4, 0, 0.2, 1]
                        }
                      }}
                      className={`relative bg-gradient-to-br ${category.gradient} flex items-center justify-center gap-2 shadow-2xl cursor-pointer group-hover:shadow-purple-500/50 z-10 overflow-hidden`}
                      style={{ 
                        height: "5rem",
                        willChange: "border-radius, width"
                      }}
                    >
                      <motion.div
                        variants={{
                          initial: { opacity: 1, scale: 1, x: 0 },
                          hover: { opacity: 0.1, scale: 0.6, x: -20, width: 0 }
                        }}
                        transition={{ duration: 0.2, ease: "easeIn" }}
                        className="flex-shrink-0 flex items-center justify-center absolute pointer-events-none"
                        style={{ width: "5rem" }}
                      >
                        <category.icon className="h-10 w-10 md:h-12 md:w-12 text-white" />
                      </motion.div>
                      
                      <motion.div
                        variants={{
                          initial: { opacity: 0, x: -10, width: 0 },
                          hover: { opacity: 1, x: 0, width: "auto" }
                        }}
                        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                        className="overflow-hidden whitespace-nowrap flex items-center gap-2 relative z-10"
                      >
                        <span className="text-white font-semibold text-sm">{category.name}</span>
                        <ArrowRight className="h-4 w-4 text-white flex-shrink-0" />
                      </motion.div>
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Alternative: Simple text links for mobile */}
        <div className="md:hidden mt-12 space-y-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={category.path}
              onClick={handleLinkClick}
              className="flex items-center justify-between p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-white font-semibold group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all">
                  {category.name}
                </span>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

