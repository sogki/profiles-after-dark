"use client";

import { Link } from "react-router-dom";
import { Users, ImageIcon, Heart, Sparkles, ArrowRight, Mail, Github, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import useFooterStats from "@/hooks/footer-stats/use-footer-stats";
import useRealtimeFooterStats from "@/hooks/footer-stats/use-realtime-stats";

export default function Footer() {
  const { data: stats, isLoading } = useFooterStats();

  useRealtimeFooterStats();

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800/95 to-slate-900 border-t border-slate-700/30">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Section */}
          <div className="col-span-1 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link to="/" className="inline-block mb-6 group">
                <div className="relative">
                <img
                  src="https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles-after-dark-logomark.png"
                    className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                  alt="Profiles After Dark logo"
                />
                  <div className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </div>
              </Link>
              <p className="text-slate-300 leading-relaxed max-w-md mb-8 text-base">
                Discover stunning profile pictures, banners, wallpapers, and emotes. Join our community of creators sharing aesthetic content for your digital presence.
              </p>

            {/* Real-time Stats */}
              <div className="grid grid-cols-2 gap-4">
              <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="group relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-5 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-xl border border-blue-500/40 group-hover:scale-110 transition-transform duration-300">
                        <Users className="h-5 w-5 text-blue-400" />
                  </div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Members
                  </span>
                </div>
                {isLoading ? (
                      <div className="h-7 bg-slate-700/50 rounded-lg animate-pulse"></div>
                ) : (
                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {formatNumber(stats?.members || 0)}+
                  </p>
                )}
                  </div>
              </motion.div>
              <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl border border-purple-500/40 group-hover:scale-110 transition-transform duration-300">
                        <ImageIcon className="h-5 w-5 text-purple-400" />
                  </div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Assets
                  </span>
                </div>
                {isLoading ? (
                      <div className="h-7 bg-slate-700/50 rounded-lg animate-pulse"></div>
                ) : (
                      <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    {formatNumber(stats?.assets || 0)}+
                  </p>
                )}
                  </div>
              </motion.div>
            </div>
            </motion.div>
          </div>

          {/* Galleries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Galleries
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/gallery/pfps", label: "Profile Pictures" },
                { to: "/gallery/banners", label: "Profile Banners" },
                { to: "/gallery/profiles", label: "Profile Combos" },
                { to: "/gallery/emotes", label: "Emotes" },
                { to: "/gallery/wallpapers", label: "Wallpapers" },
                { to: "/gallery/emoji-combos", label: "Emoji Combos" },
              ].map((link) => (
                <li key={link.to}>
                <Link
                    to={link.to}
                    className="text-slate-300 hover:text-purple-400 transition-all duration-200 text-sm group flex items-center gap-3 hover:translate-x-1"
                >
                    <ArrowRight className="h-3.5 w-3.5 text-purple-500/0 group-hover:text-purple-400 group-hover:translate-x-0 -translate-x-2 transition-all duration-200" />
                    <span>{link.label}</span>
                </Link>
              </li>
              ))}
            </ul>
          </motion.div>

          {/* Account */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              Account
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/profile-settings", label: "Account Settings" },
                { to: "/help", label: "Help Center" },
                { to: "/appeals", label: "Appeals" },
              ].map((link) => (
                <li key={link.to}>
                <Link
                    to={link.to}
                    className="text-slate-300 hover:text-blue-400 transition-all duration-200 text-sm group flex items-center gap-3 hover:translate-x-1"
                >
                    <ArrowRight className="h-3.5 w-3.5 text-blue-500/0 group-hover:text-blue-400 group-hover:translate-x-0 -translate-x-2 transition-all duration-200" />
                    <span>{link.label}</span>
                </Link>
              </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-wider flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-400" />
              Legal
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/terms", label: "Terms of Service" },
                { to: "/policies", label: "Privacy Policy" },
                { to: "/guidelines", label: "Community Guidelines" },
                { to: "/report-content", label: "Report Content", isRed: true },
              ].map((link) => (
                <li key={link.to}>
                <Link
                    to={link.to}
                    className={`text-slate-300 hover:${link.isRed ? 'text-red-400' : 'text-slate-200'} transition-all duration-200 text-sm group flex items-center gap-3 hover:translate-x-1`}
                >
                    <ArrowRight className={`h-3.5 w-3.5 ${link.isRed ? 'text-red-500/0 group-hover:text-red-400' : 'text-slate-500/0 group-hover:text-slate-300'} group-hover:translate-x-0 -translate-x-2 transition-all duration-200`} />
                    <span>{link.label}</span>
                </Link>
              </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t border-slate-700/30 mt-12 pt-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
              <p className="text-slate-400">
                © {new Date().getFullYear()} Profiles After Dark. All rights reserved.
            </p>
              <div className="flex items-center gap-2">
              <span className="text-slate-600">•</span>
                <span className="text-slate-500">Made with</span>
                <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                <span className="text-slate-500">for creators</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-purple-300">v2.0.0</span>
              </div>
              <div className="h-6 w-px bg-slate-700/50" />
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Last updated:</span>
                <span className="text-xs text-slate-400 font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
