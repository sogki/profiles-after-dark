import { useState, useEffect, Suspense, lazy } from "react"
import { BrowserRouter, Routes, Route, useSearchParams, useLocation } from "react-router-dom"

// Core components (loaded immediately)
import Header from "./components/Header"
import Hero from "./components/Hero"
import Gallery from "./components/Gallery"
import Footer from "./components/Footer"
import DiscordCTA from "./components/DiscordCTA"
import QuickCategories from "./components/QuickCategories"
import HowItWorks from "./components/HowItWorks"
import KeyBenefits from "./components/KeyBenefits"
import CombinedCTAs from "./components/CombinedCTAs"
import VisualShowcase from "./components/VisualShowcase"
// import MobileBottomNav from "./components/MobileBottomNav"

// Lazy load heavy components
const UploadModal = lazy(() => import("./components/UploadModal"))
const AuthModal = lazy(() => import("./components/AuthModal"))
const ProfileSettings = lazy(() => import("./components/users/ProfileSettings"))
const UsersList = lazy(() => import("./components/users/UserList"))
const CommunityPage = lazy(() => import("./components/users/CommunityPage"))
const UserProfile = lazy(() => import("./components/users/UserProfile"))
const ProfilesGallery = lazy(() => import("./components/gallery/ProfilesGallery"))
const PfpGallery = lazy(() => import("./components/gallery/PfpGallery"))
const BannersGallery = lazy(() => import("./components/gallery/BannersGallery"))
const EmotesGallery = lazy(() => import("./components/gallery/EmotesGallery"))
const EmojiCombosGallery = lazy(() => import("./components/gallery/EmojiCombosGallery"))
const WallpaperGallery = lazy(() => import("./components/gallery/WallpaperGallery"))
const TrendingPage = lazy(() => import("./components/gallery/Trending"))
const TagBrowse = lazy(() => import("./components/browse/TagBrowse"))
const UploadPage = lazy(() => import("./components/upload/UploadPage"))
const ModerationLogs = lazy(() => import("./components/users/moderation/ModerationLogs"))
const EnhancedModerationPage = lazy(() => import("./components/moderation/EnhancedModerationPage"))
const Terms = lazy(() => import("./components/legal/Terms"))
const Policies = lazy(() => import("./components/legal/Policies"))
const Guidelines = lazy(() => import("./components/legal/Guidelines"))
const ReportContent = lazy(() => import("./components/legal/ReportContent"))
const ReportFormPage = lazy(() => import("./components/report/ReportFormPage"))
const AppealsFormSystem = lazy(() => import("./components/appeal/AppealsForm"))
const AuthCallback = lazy(() => import("./components/AuthCallback"))
const ReportDetailView = lazy(() => import("./components/moderation/views/ReportDetailView"))
const HelpCenter = lazy(() => import("./components/help/HelpCenter"))
const ScrollToTop = lazy(() => import("./components/ScrollToTop"))

import { useAuth } from "./context/authContext"
import { useUpdateActivity } from "./hooks/useOnlineStatus"

// Wrapper component for AuthCallback to pass props
function AuthCallbackWrapper({ onEmailConfirmed }: { onEmailConfirmed: () => void }) {
  return <AuthCallback onEmailConfirmed={onEmailConfirmed} />
}

import { Toaster } from "react-hot-toast"

import { supabase } from "./lib/supabase"

import AnnouncementBanner from "./components/shared/AnnouncementBanner"
import PinterestTracking from "./components/PinterestTracking"

interface Announcement {
  id: string;
  title?: string | null;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'system';
  priority: number;
  action_url?: string | null;
  action_text?: string | null;
  is_dismissible: boolean;
  created_at: string;
}

function App() {
  const [searchQuery, setSearchQuery] = useState("")

  const [selectedCategory, setSelectedCategory] = useState("all")

  const [selectedType, setSelectedType] = useState("all")

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [showEmailConfirmed, setShowEmailConfirmed] = useState(false)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  const { user, loading } = useAuth()
  
  // Track user activity for online status
  useUpdateActivity()

  const [showScrollTop, setShowScrollTop] = useState(false)

  // Fetch announcements on mount and when user changes
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase.rpc('get_active_announcements', {
          p_user_id: user?.id || null,
        });

        if (error) throw error;

        setAnnouncements(data || []);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        // Fallback to old method if RPC doesn't exist yet
        const { data, error: fallbackError } = await supabase
          .from("announcements")
          .select("id, title, message, type, priority, action_url, action_text, is_dismissible, created_at")
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .order("created_at", { ascending: false });

        if (!fallbackError && data) {
          setAnnouncements(data);
        }
      }
    };

    fetchAnnouncements();

    // Set up real-time subscription
    const channel = supabase
      .channel('realtime:announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user])

  // Check for email confirmation in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('emailConfirmed') === 'true') {
      setShowEmailConfirmed(true)
      setIsAuthModalOpen(true)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Scroll listener to show/hide scroll to top button

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300)
    }

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Listen for custom event to open upload modal
  useEffect(() => {
    const handleOpenUpload = () => {
      if (user) {
        setIsUploadModalOpen(true)
      } else {
        setIsAuthModalOpen(true)
      }
    }
    window.addEventListener('openUploadModal', handleOpenUpload)
    return () => window.removeEventListener('openUploadModal', handleOpenUpload)
  }, [user])

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

  // Enhanced Moderation System Handlers
  const handleReportClick = (target: {
    userId?: string;
    username?: string;
    contentId?: string;
    contentType?: string;
    contentUrl?: string;
  }) => {
    if (user) {
      // Navigate to report form page using URL params
      const params = new URLSearchParams()
      if (target.userId) params.set('userId', target.userId)
      if (target.username) params.set('username', target.username)
      if (target.contentId) params.set('contentId', target.contentId)
      if (target.contentType) params.set('contentType', target.contentType)
      if (target.contentUrl) params.set('contentUrl', target.contentUrl)
      window.location.href = `/report-form?${params.toString()}`
    } else {
      setIsAuthModalOpen(true)
    }
  }


  if (loading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
        <div className="min-h-screen bg-background flex flex-col relative">
        <PinterestTracking />
        <Toaster 
          position="bottom-right" 
          toastOptions={{ 
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #475569',
              borderRadius: '0.75rem',
              padding: '16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                background: '#1e293b',
                border: '1px solid #10b981',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: '#1e293b',
                border: '1px solid #ef4444',
              },
            },
            loading: {
              iconTheme: {
                primary: '#8b5cf6',
                secondary: '#fff',
              },
              style: {
                background: '#1e293b',
                border: '1px solid #8b5cf6',
              },
            },
          }} 
        />

        <Header
          onAuthClick={() => setIsAuthModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Announcement banners */}
        {announcements.map((announcement) => (
          <AnnouncementBanner
            key={announcement.id}
            announcement={announcement}
            onDismiss={(id) => {
              setAnnouncements((prev) => prev.filter((a) => a.id !== id));
            }}
          />
        ))}

        <div className="flex-grow">
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-white">Loading page...</p>
            </div>
          </div>}>
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <Hero onAuthClick={() => setIsAuthModalOpen(true)} />
                    <VisualShowcase />
                    <HowItWorks />
                    <QuickCategories />
                    <KeyBenefits />
                    <CombinedCTAs />
                    <Footer />
                  </>
                }
              />
              <Route path="/profile-settings" element={<ProfileSettings />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/users" element={<CommunityPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/user/:username" element={<UserProfile />} />
              <Route path="/moderation" element={<EnhancedModerationPage />} />
              <Route path="/moderation/logs" element={<ModerationLogs />} />
              <Route path="/moderation/enhanced" element={<EnhancedModerationPage />} />
              <Route path="/moderation/reports/:reportId" element={<ReportDetailView />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/gallery/profiles" element={<ProfilesGallery />} />
              <Route path="/gallery/pfps" element={<PfpGallery />} />
              <Route path="/gallery/banners" element={<BannersGallery />} />
              <Route path="/gallery/emotes" element={<EmotesGallery />} />
              <Route path="/gallery/emoji-combos" element={<EmojiCombosGallery />} />
                  <Route path="/gallery/wallpapers" element={<WallpaperGallery />} />
              <Route path="/trending" element={<TrendingPage />} />
              <Route path="/browse/tag/:tag" element={<TagBrowse />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/guidelines" element={<Guidelines />} />
              <Route path="/report-content" element={<ReportContent />} />
              <Route path="/report-form" element={<ReportFormPage />} />
              <Route path="/appeals" element={<AppealsFormSystem/>} />
              <Route path="/auth/callback" element={<AuthCallbackWrapper onEmailConfirmed={() => {
                setShowEmailConfirmed(true);
                setIsAuthModalOpen(true);
              }} />} />
            </Routes>
          </Suspense>
        </div>

        <Suspense fallback={<div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>}>
          <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
        </Suspense>

        <Suspense fallback={<div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>}>
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => {
              setIsAuthModalOpen(false);
              setShowEmailConfirmed(false);
            }}
            showEmailConfirmed={showEmailConfirmed}
          />
        </Suspense>



        {/* Mobile Bottom Navigation - Temporarily disabled */}
        {/* <MobileBottomNav /> */}

        {/* Scroll to Top Button with fade and scale animation - Desktop only */}
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className={`hidden md:block fixed bottom-8 right-8 z-50 p-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transform origin-center
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
