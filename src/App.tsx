import { useState, useEffect } from "react"

import { BrowserRouter, Routes, Route } from "react-router-dom"

import Header from "./components/Header"

import Hero from "./components/Hero"

import Gallery from "./components/Gallery"

import UploadModal from "./components/UploadModal"

import AuthModal from "./components/AuthModal"

import Footer from "./components/Footer"

import DiscordCTA from "./components/DiscordCTA"

import ProfileSettings from "./components/users/ProfileSettings"

import UsersList from "./components/users/UserList"

import UserProfile from "./components/users/UserProfile"

import ProfilesGallery from "./components/gallery/ProfilesGallery"

import PfpGallery from "./components/gallery/PfpGallery"

import BannersGallery from "./components/gallery/BannersGallery"

import EmotesGallery from "./components/gallery/EmotesGallery"

import EmojiCombosGallery from "./components/gallery/EmojiCombosGallery"

import TrendingPage from "./components/gallery/Trending"

import ModerationPanel from "./components/users/moderation/ModerationPanel"

import ModerationLogs from "./components/users/moderation/ModerationLogs"

import Terms from "./components/legal/Terms"

import Policies from "./components/legal/Policies"

import Guidelines from "./components/legal/Guidelines"

import ReportContent from "./components/legal/ReportContent"

import { useAuth } from "./context/authContext"

import { Toaster } from "react-hot-toast"

import { supabase } from "./lib/supabase"

import { Megaphone } from "lucide-react"

function App() {
  const [searchQuery, setSearchQuery] = useState("")

  const [selectedCategory, setSelectedCategory] = useState("all")

  const [selectedType, setSelectedType] = useState("all")

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const [announcement, setAnnouncement] = useState<string | null>(null)

  const { user, loading } = useAuth()

  const [showScrollTop, setShowScrollTop] = useState(false)

  // Fetch announcement on mount

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data, error } = await supabase

        .from("announcements")

        .select("message")

        .eq("is_active", true)

        .limit(1)

        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching announcement:", error)
      } else if (data) {
        setAnnouncement(data.message)
      }
    }

    fetchAnnouncement()
  }, [])

  // Scroll listener to show/hide scroll to top button

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300)
    }

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleUploadClick = () => {
    if (user) {
      setIsUploadModalOpen(true)
    } else {
      setIsAuthModalOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col relative">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

        <Header
          onUploadClick={handleUploadClick}
          onAuthClick={() => setIsAuthModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          user={user}
        />

        {/* Announcement banner */}

        {announcement && (
         <div className="flex justify-center bg-red-500/50 text-white px-4 py-2 text-center font-semibold"> <Megaphone className="mr-5"/> {announcement}</div>
        )}

        <div className="flex-grow">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Hero />

                  <Gallery
                    searchQuery={searchQuery}
                    selectedCategory={selectedCategory}
                    selectedType={selectedType}
                    viewMode={viewMode}
                  />

                  <DiscordCTA />

                  <Footer />
                </>
              }
            />

            <Route path="/profile-settings" element={<ProfileSettings />} />

            {/* User routes */}

            <Route path="/users" element={<UsersList />} />

            <Route path="/user/:username" element={<UserProfile />} />

            {/* Moderation route */}

            <Route path="/moderation" element={<ModerationPanel />} />

            <Route path="/moderation/logs" element={<ModerationLogs />} />

            {/* Gallery routes */}

            <Route path="/gallery/profiles" element={<ProfilesGallery />} />

            <Route path="/gallery/pfps" element={<PfpGallery />} />

            <Route path="/gallery/banners" element={<BannersGallery />} />

            <Route path="/gallery/emotes" element={<EmotesGallery />} />

            <Route path="/gallery/emoji-combos" element={<EmojiCombosGallery />} />

            {/* Trending route */}

            <Route path="/trending" element={<TrendingPage />} />

            {/* Legal routes */}

            <Route path="/terms" element={<Terms />} />

            <Route path="/policies" element={<Policies />} />

            <Route path="/guidelines" element={<Guidelines />} />

            <Route path="/report-content" element={<ReportContent />} />
          </Routes>
        </div>

        <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

        {/* Scroll to Top Button with fade and scale animation */}
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transform origin-center
    ${showScrollTop ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none"}
  `}
          style={{ transitionProperty: "opacity, transform" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </BrowserRouter>
  )
}

export default App
