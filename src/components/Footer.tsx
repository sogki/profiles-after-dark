"use client";

import { Link } from "react-router-dom";
import { Heart, Users, ImageIcon, Palette, Shield } from "lucide-react";
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
    <footer className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-8">
              <img
                src="https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles-after-dark-logomark.png"
                className="h-8 w-auto object-contain mb-3"
                alt="Profiles After Dark logo"
              />
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Discover stunning profile pictures, banners, wallpapers, and emotes. Join our community of creators sharing aesthetic content for your digital presence.
              </p>
            </div>

            {/* Real-time Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-slate-600 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    Members
                  </span>
                </div>
                {isLoading ? (
                  <div className="h-6 bg-slate-700/50 rounded animate-pulse"></div>
                ) : (
                  <p className="text-xl font-bold text-white">
                    {formatNumber(stats?.members || 0)}+
                  </p>
                )}
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-slate-600 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-500/10 rounded-lg">
                    <ImageIcon className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    Assets
                  </span>
                </div>
                {isLoading ? (
                  <div className="h-6 bg-slate-700/50 rounded animate-pulse"></div>
                ) : (
                  <p className="text-xl font-bold text-white">
                    {formatNumber(stats?.assets || 0)}+
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Galleries</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/gallery/pfps"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 text-sm"
                >
                  Profile Pictures
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery/banners"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 text-sm"
                >
                  Profile Banners
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery/profiles"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 text-sm"
                >
                  Emoji Combos
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery/emotes"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 text-sm"
                >
                  Emotes
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery/wallpapers"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 text-sm"
                >
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
                  className="text-slate-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                >
                  Account Settings
                </Link>
              </li>
              <li>
                <Link
                  to="/appeals"
                  className="text-slate-400 hover:text-blue-400 transition-colors duration-200 text-sm"
                >
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
                  className="text-slate-400 hover:text-slate-300 transition-colors duration-200 text-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/policies"
                  className="text-slate-400 hover:text-slate-300 transition-colors duration-200 text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/guidelines"
                  className="text-slate-400 hover:text-slate-300 transition-colors duration-200 text-sm"
                >
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  to="/report-content"
                  className="text-slate-400 hover:text-red-400 transition-colors duration-200 text-sm"
                >
                  Report Content
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800/50 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs">
              © 2025 Profiles After Dark. All rights reserved.
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
