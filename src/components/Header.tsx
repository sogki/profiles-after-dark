import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  Search,
  Upload,
  Menu,
  X,
  UserIcon,
  LogOut,
  Settings,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  Users,
  ImageIcon,
  Layout,
  Smile,
  Sticker,
  Trophy
} from "lucide-react"
import { useAuth } from "../context/authContext"
import { supabase } from "../lib/supabase"
import { useNotifications } from "../hooks/useNotifications"
import NotificationCenter from "./NotificationCenter"
import { trackSearch } from "../lib/pinterestTracking"

interface HeaderProps {
  onUploadClick: () => void
  onAuthClick: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function Header({ onAuthClick, searchQuery, onSearchChange }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const { user, userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSubNav, setShowSubNav] = useState(true)
  const lastScrollY = useRef(0)

  const { unreadCount, notifications, markAsRead, markAllAsRead, deleteNotification, deleteNotifications } = useNotifications()

  // User dropdown state
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Search suggestions
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{type: string, text: string, id?: string, username?: string}>>([])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  
  // Notification center state
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY < 100) {
        setShowSubNav(true)
      } else if (currentScrollY > lastScrollY.current) {
        setShowSubNav(false)
      } else {
        setShowSubNav(true)
      }
      lastScrollY.current = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      // Check if click is outside notification center
      const notificationCenter = document.querySelector('[data-notification-center]')
      if (notificationCenter && !notificationCenter.contains(target) && notifRef.current && !notifRef.current.contains(target)) {
        setIsNotificationCenterOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setIsUserDropdownOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch search suggestions
  useEffect(() => {
    if (searchQuery.length > 1) {
      fetchSearchSuggestions(searchQuery)
    } else {
      setSearchSuggestions([])
      setShowSearchSuggestions(false)
    }
  }, [searchQuery])

  const fetchSearchSuggestions = async (query: string) => {
    try {
      const searchTerm = `%${query}%`
      const suggestions: Array<{type: string, text: string, id?: string}> = []
      const seenKeys = new Set<string>() // Track case-insensitive duplicates

      // Helper function to check if suggestion already exists (case-insensitive)
      const isDuplicate = (type: string, text: string): boolean => {
        const key = `${type.toLowerCase()}:${text.toLowerCase()}`
        if (seenKeys.has(key)) {
          return true
        }
        seenKeys.add(key)
        return false
      }

      // Search profiles (title)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, title, tags")
        .eq("status", "approved")
        .ilike("title", searchTerm)
        .limit(3)

      if (!profilesError && profiles) {
        profiles.forEach(profile => {
          if (!isDuplicate("profile", profile.title)) {
            suggestions.push({ type: "profile", text: profile.title, id: profile.id })
          }
          // Add matching tags
          if (profile.tags && Array.isArray(profile.tags)) {
            profile.tags.forEach(tag => {
              if (tag.toLowerCase().includes(query.toLowerCase()) && !isDuplicate("tag", tag)) {
                suggestions.push({ type: "tag", text: tag })
              }
            })
          }
        })
      }

      // Search user profiles (username and display_name)
      const { data: users, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, username, display_name")
        .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
        .limit(2)

      if (!usersError && users) {
        users.forEach(user => {
          const name = user.display_name || user.username || ""
          if (name && user.username && !isDuplicate("user", name)) {
            suggestions.push({ type: "user", text: name, id: user.id, username: user.username })
          }
        })
      }

      // Search emotes
      const { data: emotes, error: emotesError } = await supabase
        .from("emotes")
        .select("id, title, tags")
        .eq("status", "approved")
        .ilike("title", searchTerm)
        .limit(2)

      if (!emotesError && emotes) {
        emotes.forEach(emote => {
          if (!isDuplicate("emote", emote.title)) {
            suggestions.push({ type: "emote", text: emote.title, id: emote.id })
          }
        })
      }

      // Search wallpapers
      const { data: wallpapers, error: wallpapersError } = await supabase
        .from("wallpapers")
        .select("id, title, tags")
        .eq("status", "approved")
        .ilike("title", searchTerm)
        .limit(2)

      if (!wallpapersError && wallpapers) {
        wallpapers.forEach(wallpaper => {
          if (!isDuplicate("wallpaper", wallpaper.title)) {
            suggestions.push({ type: "wallpaper", text: wallpaper.title, id: wallpaper.id })
          }
        })
      }

      setSearchSuggestions(suggestions.slice(0, 8))
      setShowSearchSuggestions(suggestions.length > 0)
    } catch (error) {
      console.error("Failed to fetch search suggestions:", error)
      setSearchSuggestions([])
      setShowSearchSuggestions(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
    setIsMobileMenuOpen(false)
    setIsUserDropdownOpen(false)
  }

  const isActive = (path: string) => location.pathname === path

  const handleSearchSuggestionClick = (suggestion: {type: string, text: string, id?: string, username?: string}) => {
    onSearchChange(suggestion.text)
    setShowSearchSuggestions(false)
    
    // Navigate based on type
    if (suggestion.type === "user" && suggestion.username) {
      navigate(`/user/${suggestion.username}`)
    } else if (suggestion.type === "profile") {
      navigate(`/gallery/profiles?search=${encodeURIComponent(suggestion.text)}`)
    } else if (suggestion.type === "emote") {
      navigate(`/gallery/emotes?search=${encodeURIComponent(suggestion.text)}`)
    } else if (suggestion.type === "wallpaper") {
      navigate(`/gallery/wallpapers?search=${encodeURIComponent(suggestion.text)}`)
    } else if (suggestion.type === "tag") {
      navigate(`/browse/tag/${encodeURIComponent(suggestion.text)}`)
    }
  }

  return (
    <>
      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
        deleteNotification={deleteNotification}
        deleteNotifications={deleteNotifications}
      />
      
          <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Enhanced Logo - Left Side */}
            <Link to="/" className="flex items-center hover:opacity-90 transition-opacity group flex-shrink-0">
              <div className="relative">
                <img
                  src="https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles-after-dark-logomark.png"
                  className="h-9 w-auto group-hover:scale-105 transition-transform duration-300 object-contain"
                  alt="Profiles After Dark logo"
                />
              </div>
            </Link>

            {/* Desktop Navigation - Center Search */}
            <div className="hidden md:flex items-center flex-1 justify-center max-w-2xl mx-12">
              {/* Enhanced Search - Centered */}
              <div className="relative w-full" ref={searchRef}>
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-300 z-10" />
                <input
                  type="text"
                  placeholder="Search profiles, users, tags..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => searchQuery.length > 1 && setShowSearchSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      // Track Pinterest search event
                      trackSearch(searchQuery);
                      navigate(`/trending?search=${encodeURIComponent(searchQuery)}`)
                    }
                  }}
                  className="pl-11 pr-4 py-2.5 w-full bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm hover:bg-slate-800/70"
                />

                {/* Search Suggestions */}
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-xl z-50 overflow-hidden">
                    {searchSuggestions.map((suggestion, index) => {
                      const getIcon = () => {
                        switch(suggestion.type) {
                          case "user": return <Users className="h-3.5 w-3.5 text-blue-400" />
                          case "tag": return <span className="text-xs text-purple-400">#</span>
                          case "emote": return <Sticker className="h-3.5 w-3.5 text-orange-400" />
                          case "wallpaper": return <ImageIcon className="h-3.5 w-3.5 text-green-400" />
                          default: return <Search className="h-3.5 w-3.5 text-slate-400" />
                        }
                      }
                      return (
                        <button
                          key={`${suggestion.type}-${index}`}
                          onClick={() => handleSearchSuggestionClick(suggestion)}
                          className="w-full text-left px-4 py-2.5 text-white hover:bg-slate-700/50 transition-colors flex items-center gap-2 group"
                        >
                          <span className="flex-shrink-0">{getIcon()}</span>
                          <span className="flex-1 truncate">{suggestion.text}</span>
                          <span className="text-xs text-slate-400 capitalize flex-shrink-0 group-hover:text-slate-300 transition-colors">
                            {suggestion.type}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
              {user ? (
                <>
                  {/* Upload Button */}
                  <Link
                    to="/upload"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/30 font-medium"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden lg:inline">Upload</span>
                  </Link>

                  {/* Enhanced Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsNotificationCenterOpen(!isNotificationCenterOpen)
                      }}
                      className="relative p-2.5 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all group"
                    >
                      <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg ring-2 ring-slate-900">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Enhanced User Dropdown */}
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-800/50 transition-all group border border-transparent hover:border-slate-700/50"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-purple-400/50 transition-all">
                        {userProfile?.avatar_url ? (
                          <img
                            src={userProfile.avatar_url || "/placeholder.svg"}
                            alt="User avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                            <UserIcon className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-white transition-colors hidden lg:block" />
                    </button>

                    <AnimatePresence>
                      {isUserDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-xl shadow-2xl z-50 border border-slate-700/80 overflow-hidden backdrop-blur-xl"
                        >
                          {/* User Header Section */}
                          <div className="p-5 bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-800 border-b border-slate-700/60">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-purple-500/40 ring-offset-2 ring-offset-slate-800">
                                  {userProfile?.avatar_url ? (
                                    <img
                                      src={userProfile.avatar_url || "/placeholder.svg"}
                                      alt="User avatar"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                                      <UserIcon className="h-7 w-7 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-white truncate mb-0.5">
                                  {userProfile?.display_name || userProfile?.username || "User"}
                                </p>
                                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                {userProfile?.username && (
                                  <p className="text-xs text-slate-500 mt-1">@{userProfile.username}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-2">
                            {(userProfile?.role === "admin" || userProfile?.role === "moderator" || userProfile?.role === "staff") && (
                              <Link
                                to="/moderation"
                                className="flex items-center px-5 py-3 text-sm text-slate-200 hover:text-white hover:bg-slate-700/40 transition-all group relative"
                                onClick={() => setIsUserDropdownOpen(false)}
                              >
                                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-all mr-3 group-hover:scale-110">
                                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                                </div>
                                <span className="font-medium">Moderation Panel</span>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ChevronDown className="w-4 h-4 text-slate-400 rotate-[-90deg]" />
                                </div>
                              </Link>
                            )}
                            {userProfile?.username && (
                              <Link
                                to={`/user/${userProfile.username}`}
                                className="flex items-center px-5 py-3 text-sm text-slate-200 hover:text-white hover:bg-slate-700/40 transition-all group relative"
                                onClick={() => setIsUserDropdownOpen(false)}
                              >
                                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-all mr-3 group-hover:scale-110">
                                  <UserIcon className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="font-medium">View Profile</span>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ChevronDown className="w-4 h-4 text-slate-400 rotate-[-90deg]" />
                                </div>
                              </Link>
                            )}
                            <Link
                              to="/profile-settings"
                              className="flex items-center px-5 py-3 text-sm text-slate-200 hover:text-white hover:bg-slate-700/40 transition-all group relative"
                              onClick={() => setIsUserDropdownOpen(false)}
                            >
                              <div className="p-2 rounded-lg bg-slate-500/10 group-hover:bg-slate-500/20 transition-all mr-3 group-hover:scale-110">
                                <Settings className="w-4 h-4 text-slate-300" />
                              </div>
                              <span className="font-medium">Settings</span>
                              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronDown className="w-4 h-4 text-slate-400 rotate-[-90deg]" />
                              </div>
                            </Link>
                            <Link
                              to="/badges"
                              className="flex items-center px-5 py-3 text-sm text-slate-200 hover:text-white hover:bg-slate-700/40 transition-all group relative"
                              onClick={() => setIsUserDropdownOpen(false)}
                            >
                              <div className="p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-all mr-3 group-hover:scale-110">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                              </div>
                              <span className="font-medium">Badges</span>
                              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronDown className="w-4 h-4 text-slate-400 rotate-[-90deg]" />
                              </div>
                            </Link>
                            
                            {/* Divider */}
                            <div className="border-t border-slate-700/60 my-2 mx-3"></div>
                            
                            {/* Sign Out */}
                            <button
                              onClick={handleSignOut}
                              className="flex items-center w-full text-left px-5 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group relative"
                            >
                              <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-all mr-3 group-hover:scale-110">
                                <LogOut className="w-4 h-4 text-red-400" />
                              </div>
                              <span className="font-medium">Sign Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <button
                  onClick={onAuthClick}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/30 font-medium"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="text-white hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Overlay */}
          <AnimatePresence>
            {isMobileSearchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="md:hidden border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-sm"
              >
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-300 z-10" />
                    <input
                      type="text"
                      placeholder="Search profiles, users, tags..."
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onFocus={() => searchQuery.length > 1 && setShowSearchSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQuery.trim()) {
                          // Track Pinterest search event
                          trackSearch(searchQuery);
                          navigate(`/trending?search=${encodeURIComponent(searchQuery)}`)
                          setIsMobileSearchOpen(false)
                        }
                      }}
                      className="pl-10 pr-10 py-3 w-full bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      autoFocus
                    />
                    <button
                      onClick={() => setIsMobileSearchOpen(false)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Mobile Search Suggestions */}
                  {showSearchSuggestions && searchSuggestions.length > 0 && (
                    <div className="mt-2 bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600/50">
                      {searchSuggestions.map((suggestion, index) => {
                        const getIcon = () => {
                          switch(suggestion.type) {
                            case "user": return <Users className="h-4 w-4 text-blue-400" />
                            case "tag": return <span className="text-xs text-purple-400">#</span>
                            case "emote": return <Sticker className="h-4 w-4 text-orange-400" />
                            case "wallpaper": return <ImageIcon className="h-4 w-4 text-green-400" />
                            default: return <Search className="h-4 w-4 text-slate-400" />
                          }
                        }
                        return (
                          <button
                            key={`${suggestion.type}-${index}`}
                            onClick={() => {
                              handleSearchSuggestionClick(suggestion)
                              setIsMobileSearchOpen(false)
                            }}
                            className="w-full text-left px-4 py-3 text-white hover:bg-slate-600 transition-colors flex items-center gap-3 group"
                          >
                            <span className="flex-shrink-0">{getIcon()}</span>
                            <span className="flex-1 truncate">{suggestion.text}</span>
                            <span className="text-xs text-slate-400 capitalize flex-shrink-0 group-hover:text-slate-300 transition-colors">
                              {suggestion.type}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="md:hidden border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-sm"
              >
                <div className="p-4">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Link
                      to="/users"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50"
                    >
                      <Users className="h-5 w-5 text-blue-400" />
                      <span className="text-sm text-white">Community</span>
                    </Link>
                    
                    <Link
                      to="/trending"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50"
                    >
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      <span className="text-sm text-white">Trending</span>
                    </Link>
                    
                    <Link
                      to="/gallery/profiles"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50"
                    >
                      <ImageIcon className="h-5 w-5 text-purple-400" />
                      <span className="text-sm text-white">Profiles</span>
                    </Link>
                    
                    <Link
                      to="/gallery/pfps"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50"
                    >
                      <ImageIcon className="h-5 w-5 text-pink-400" />
                      <span className="text-sm text-white">PFPs</span>
                    </Link>

                    <Link
                      to="/gallery/emotes"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50"
                    >
                      <Sticker className="h-5 w-5 text-orange-400" />
                      <span className="text-sm text-white">Emotes</span>
                    </Link>

                    <Link
                      to="/gallery/wallpapers"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50"
                    >
                      <ImageIcon className="h-5 w-5 text-indigo-400" />
                      <span className="text-sm text-white">Wallpapers</span>
                    </Link>
                  </div>

                  {/* User Actions */}
                  {user ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          navigate("/upload")
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload Content</span>
                      </button>

                      {userProfile?.role === "admin" || userProfile?.role === "moderator" || userProfile?.role === "staff" ? (
                        <Link
                          to="/moderation"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>Mod Panel 2.0</span>
                        </Link>
                      ) : null}

                      {userProfile?.username && (
                        <Link
                          to={`/user/${userProfile.username}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                        >
                          <UserIcon className="h-4 w-4" />
                          <span>My Profile</span>
                        </Link>
                      )}

                      <Link
                        to="/profile-settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onAuthClick()
                        setIsMobileMenuOpen(false)
                      }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium"
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>Sign In</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Enhanced Sub Navigation - Desktop Only */}
      <nav
        className={`
          hidden md:block bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 sticky top-16 z-40
          transition-transform duration-300 ease-in-out
          ${showSubNav ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-1 py-3">
            {/* Community - Separated */}
            <Link
              to="/users"
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive("/users")
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white border border-transparent hover:border-slate-600/50"
              }`}
            >
              <Users className="inline h-4 w-4 mr-1.5" />
              Community
            </Link>

            {/* Separator */}
            <div className="w-px h-6 bg-slate-700/50 mx-2" />

            {/* Content Pages - Grouped */}
            <div className="flex items-center gap-1">
              <Link
                to="/gallery/profiles"
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive("/gallery/profiles")
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <UserIcon className="inline h-4 w-4 mr-1.5" />
                Profiles
              </Link>
              <Link
                to="/gallery/pfps"
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive("/gallery/pfps")
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <ImageIcon className="inline h-4 w-4 mr-1.5" />
                PFPs
              </Link>
              <Link
                to="/gallery/banners"
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive("/gallery/banners")
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Layout className="inline h-4 w-4 mr-1.5" />
                Banners
              </Link>
              <Link
                to="/gallery/emoji-combos"
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive("/gallery/emoji-combos")
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Smile className="inline h-4 w-4 mr-1.5" />
                Emoji Combos
              </Link>
              <Link
                to="/gallery/emotes"
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive("/gallery/emotes")
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Sticker className="inline h-4 w-4 mr-1.5" />
                Emotes
              </Link>
              <Link
                to="/gallery/wallpapers"
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive("/gallery/wallpapers")
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <ImageIcon className="inline h-4 w-4 mr-1.5" />
                Wallpapers
              </Link>
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-slate-700/50 mx-2" />

            {/* Trending - Separated */}
            <Link
              to="/trending"
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive("/trending")
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white border border-transparent hover:border-slate-600/50"
              }`}
            >
              <TrendingUp className="inline h-4 w-4 mr-1.5" />
              Trending
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
