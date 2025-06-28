"use client"

import { Link } from "react-router-dom"
import { Moon, Heart, Users, ImageIcon, Palette, Shield } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Footer() {
  const [stats, setStats] = useState({
    members: 0,
    assets: 0,
    loading: true,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch member count
        const { count: memberCount } = await supabase.from("user_profiles").select("*", { count: "exact", head: true })

        // Fetch total assets count (pfps + banners)
        const { count: pfpCount } = await supabase.from("pfps").select("*", { count: "exact", head: true })

        const { count: bannerCount } = await supabase.from("banners").select("*", { count: "exact", head: true })

        setStats({
          members: memberCount || 0,
          assets: (pfpCount || 0) + (bannerCount || 0),
          loading: false,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
        setStats({
          members: 0,
          assets: 0,
          loading: false,
        })
      }
    }

    fetchStats()

    // Set up real-time subscriptions for live updates
    const membersSubscription = supabase
      .channel("members-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_profiles" }, () => fetchStats())
      .subscribe()

    const pfpsSubscription = supabase
      .channel("pfps-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pfps" }, () => fetchStats())
      .subscribe()

    const bannersSubscription = supabase
      .channel("banners-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => fetchStats())
      .subscribe()

    return () => {
      membersSubscription.unsubscribe()
      pfpsSubscription.unsubscribe()
      bannersSubscription.unsubscribe()
    }
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
                <Moon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Profiles After Dark
                </h3>
                <p className="text-sm text-purple-400 font-medium">Aesthetic profiles for the night owls</p>
              </div>
            </div>
            <p className="text-slate-300 mb-8 max-w-md leading-relaxed">
              The ultimate destination for stunning profile pictures and banners. Join our passionate community who've discovered their
              perfect aesthetic in our curated collection.
            </p>

            {/* Real-time Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Members</span>
                </div>
                {stats.loading ? (
                  <div className="h-7 bg-slate-700 rounded animate-pulse"></div>
                ) : (
                  <p className="text-xl font-bold text-white">{formatNumber(stats.members)}+</p>
                )}
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Assets</span>
                </div>
                {stats.loading ? (
                  <div className="h-7 bg-slate-700 rounded animate-pulse"></div>
                ) : (
                  <p className="text-xl font-bold text-white">{formatNumber(stats.assets)}+</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Palette className="h-5 w-5 text-purple-400" />
              <h4 className="text-white font-bold text-lg">Galleries</h4>
            </div>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/gallery/pfps"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Profile Pictures
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery/banners"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Profile Banners
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery/profiles"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Profile Combos
                </Link>
              </li>
              <li>
                <Link
                  to="/users"
                  className="text-slate-400 hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Members
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Users className="h-5 w-5 text-blue-400" />
              <h4 className="text-white font-bold text-lg">Account</h4>
            </div>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/profile-settings"
                  className="text-slate-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Settings
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="text-slate-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  My Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/favorites"
                  className="text-slate-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Favorites
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-green-400" />
              <h4 className="text-white font-bold text-lg">Legal</h4>
            </div>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/terms"
                  className="text-slate-400 hover:text-green-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/policies"
                  className="text-slate-400 hover:text-green-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/guidelines"
                  className="text-slate-400 hover:text-green-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  to="/report-content"
                  className="text-slate-400 hover:text-red-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Report Content
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-700/50 mt-16 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <p className="text-slate-400 text-sm">© 2025 Profiles After Dark. All rights reserved.</p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>v2.1.0</span>
                <span>•</span>
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Made with love */}
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span>Crafted with</span>
              <Heart className="h-4 w-4 text-red-400 animate-pulse" />
              <span>by</span>
              <span className="text-white font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Soggs
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
