"use client";

import { Link } from "react-router-dom";
import { Users, ImageIcon } from "lucide-react";
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
    <footer className="bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-8">
              <Link to="/" className="inline-block mb-4 group">
                <img
                  src="https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles-after-dark-logomark.png"
                  className="h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                  alt="Profiles After Dark logo"
                />
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Discover stunning profile pictures, banners, wallpapers, and emotes. Join our community of creators sharing aesthetic content for your digital presence.
              </p>
            </div>

            {/* Real-time Stats */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all shadow-lg hover:shadow-purple-500/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    Members
                  </span>
                </div>
                {isLoading ? (
                  <div className="h-6 bg-slate-700/50 rounded animate-pulse"></div>
                ) : (
                  <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {formatNumber(stats?.members || 0)}+
                  </p>
                )}
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all shadow-lg hover:shadow-purple-500/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                    <ImageIcon className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    Assets
                  </span>
                </div>
                {isLoading ? (
                  <div className="h-6 bg-slate-700/50 rounded animate-pulse"></div>
                ) : (
                  <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {formatNumber(stats?.assets || 0)}+
                  </p>
                )}
              </motion.div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Galleries</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/gallery/pfps"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 text-sm group flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Profile Pictures
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery/banners"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 text-sm group flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Profile Banners
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery/profiles"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 text-sm group flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Emoji Combos
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery/emotes"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 text-sm group flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Emotes
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery/wallpapers"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 text-sm group flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Wallpapers
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Account</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/profile-settings"
                  className="text-slate-400 hover:text-blue-400 transition-colors duration-200 text-sm group flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Account Settings
                </Link>
              </li>
              <li>
                <Link
                  to="/appeals"
                  className="text-slate-400 hover:text-blue-400 transition-colors duration-200 text-sm group flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Appeals
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/terms"
                  className="text-slate-400 hover:text-slate-300 transition-colors duration-200 text-sm group flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/policies"
                  className="text-slate-400 hover:text-slate-300 transition-colors duration-200 text-sm group flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/guidelines"
                  className="text-slate-400 hover:text-slate-300 transition-colors duration-200 text-sm group flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  to="/report-content"
                  className="text-slate-400 hover:text-red-400 transition-colors duration-200 text-sm group flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-red-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Report Content
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-700/50 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs">
              2025 © Profiles After Dark. All rights reserved.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>v2.1.0</span>
              <span className="text-slate-600">•</span>
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
