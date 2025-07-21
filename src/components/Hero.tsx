"use client"

import { useState, useEffect } from "react"
import { Download, Users, ImageIcon, ArrowRight, Sparkles, TrendingUp } from "lucide-react"
import { useAuth } from "../context/authContext"
import { supabase } from "../lib/supabase"

interface HeroStats {
  totalProfiles: number
  totalDownloads: number
  totalUsers: number
}

export default function Hero() {
  const { user } = useAuth()
  const [stats, setStats] = useState<HeroStats>({
    totalProfiles: 0,
    totalDownloads: 0,
    totalUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch total profiles from both tables
        const [pairsResponse, profilesResponse, usersResponse] = await Promise.all([
          supabase.from("profile_pairs").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id, download_count", { count: "exact" }),
          supabase.from("user_profiles").select("id", { count: "exact", head: true }),
        ])

        const totalProfiles = (pairsResponse.count || 0) + (profilesResponse.count || 0)
        const totalDownloads =
          profilesResponse.data?.reduce((sum, profile) => sum + (profile.download_count || 0), 0) || 0
        const totalUsers = usersResponse.count || 0

        setStats({
          totalProfiles,
          totalDownloads,
          totalUsers,
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const scrollToGallery = () => {
    // Try to find the gallery section by class or navigate to gallery page
    const galleryElement =
      document.querySelector("[data-gallery]") ||
      document.querySelector(".profiles-gallery") ||
      document.querySelector("main")

    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: "smooth" })
    } else {
      // If no gallery found on current page, navigate to gallery route
      window.location.href = "/gallery" // Adjust this path to match your routing
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-black via-blue-900/20 to-slate-900">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-700"></div>

        {/* Additional floating elements */}
        <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-900"></div>

        {/* Gradient orbs */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-purple-600/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-blue-600/10 rounded-full blur-xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* Logo with enhanced styling */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
              <div className="relative">
                <img
                  src="https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles-after-dark-logomark.png"
                  alt="Profiles After Dark"
                  className="h-15 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>

          {/* Enhanced tagline */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4 leading-tight">
              Profiles That Come Alive
            </h1>
          </div>

          <p className="text-lg text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover and download stunning aesthetic profile pictures and banners for all your favourite social media.
            Join the night owls who know that the best profiles come alive after dark.
          </p>

          {/* Call-to-action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={scrollToGallery}
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              <Sparkles className="h-5 w-5" />
              Explore Gallery
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {!user && (
              <button className="inline-flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50">
                <Users className="h-5 w-5" />
                Join Community
              </button>
            )}
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-purple-600/20 rounded-full">
                  <ImageIcon className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {isLoading ? "..." : stats.totalProfiles.toLocaleString()}
              </div>
              <div className="text-slate-400 text-sm">Total Profiles</div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-green-600/20 rounded-full">
                  <Download className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {isLoading ? "..." : stats.totalDownloads.toLocaleString()}
              </div>
              <div className="text-slate-400 text-sm">Downloads</div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-blue-600/20 rounded-full">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {isLoading ? "..." : stats.totalUsers.toLocaleString()}
              </div>
              <div className="text-slate-400 text-sm">Community Members</div>
            </div>
          </div>

          {/* Enhanced feature highlights */}
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur-sm rounded-xl px-6 py-4 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="p-2 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors">
                <ImageIcon className="h-5 w-5 text-purple-400" />
              </div>
              <span className="text-white font-medium">Profiles that express your style</span>
            </div>

            <div className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur-sm rounded-xl px-6 py-4 border border-slate-700/50 hover:border-green-500/50 transition-all duration-300 group">
              <div className="p-2 bg-green-600/20 rounded-lg group-hover:bg-green-600/30 transition-colors">
                <Download className="h-5 w-5 text-green-400" />
              </div>
              <span className="text-white font-medium">Downloads empowering your creativity</span>
            </div>

            <div className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur-sm rounded-xl px-6 py-4 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="p-2 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-white font-medium">A vibrant community of creators</span>
            </div>
          </div>

          {/* Trending/Popular indicator */}
          <div className="mt-12 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-full px-4 py-2 text-orange-300">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Trending: Dark aesthetic profiles</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
