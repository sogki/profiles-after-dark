import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  Bell,
  Moon,
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
} from "lucide-react"
import { useAuth } from "../context/authContext"
import { supabase } from "../lib/supabase"
import { useNotifications } from "../hooks/useNotifications"
import NotificationCenter from "./NotificationCenter"

interface HeaderProps {
  onUploadClick: () => void
  onAuthClick: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function Header({ onUploadClick, onAuthClick, searchQuery, onSearchChange }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSubNav, setShowSubNav] = useState(true)
  const lastScrollY = useRef(0)

  const { unreadCount } = useNotifications()

  // User dropdown state
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // Search suggestions
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
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
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
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
      const { data, error } = await supabase.from("profiles").select("title").ilike("title", `%${query}%`).limit(5)

      if (error) throw error
      const suggestions = data?.map((item) => item.title) || []
      setSearchSuggestions(suggestions)
      setShowSearchSuggestions(suggestions.length > 0)
    } catch (error) {
      console.error("Failed to fetch search suggestions:", error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
    setIsMobileMenuOpen(false)
    setIsUserDropdownOpen(false)
  }

  const isActive = (path: string) => location.pathname === path

  const handleSearchSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion)
    setShowSearchSuggestions(false)
  }

  return (
    <>
      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
      
      <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Enhanced Logo */}
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity group">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                <Moon className="h-8 w-8 text-white relative z-10 group-hover:text-purple-300 transition-colors" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <img
                  src="https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles-after-dark-logomark.png"
                  className="h-8 group-hover:scale-105 transition-transform duration-300"
                  alt="Profiles After Dark logo"
                />
                <p className="text-xs text-slate-400 hidden sm:block group-hover:text-slate-300 transition-colors">
                  Aesthetic profiles for the night owls
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Enhanced Search */}
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search profiles, users, tags..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => searchQuery.length > 1 && setShowSearchSuggestions(true)}
                  className="pl-10 pr-4 py-2 w-80 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />

                {/* Search Suggestions */}
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchSuggestionClick(suggestion)}
                        className="w-full text-left px-4 py-2 text-white hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        <Search className="inline h-3 w-3 mr-2 text-slate-400" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {user ? (
                <div className="flex items-center space-x-4">
                  {/* Upload Button */}
                  <button
                    onClick={onUploadClick}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </button>

                  {/* Enhanced Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setIsNotificationCenterOpen(true)}
                      className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Enhanced User Dropdown */}
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-800 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-purple-400 transition-all">
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
                      <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                    </button>

                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 border border-slate-700">
                        <div className="p-4 border-b border-slate-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                              {userProfile?.avatar_url ? (
                                <img
                                  src={userProfile.avatar_url || "/placeholder.svg"}
                                  alt="User avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                                  <UserIcon className="h-5 w-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {userProfile?.display_name || userProfile?.username || "User"}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="py-2">
                          {userProfile?.role === "staff" && (
                            <Link
                              to="/moderation"
                              className="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                              onClick={() => setIsUserDropdownOpen(false)}
                            >
                              <ShieldCheck className="w-4 h-4 mr-3 text-blue-400" />
                              Moderation Panel
                            </Link>
                          )}
                          {userProfile?.username && (
                            <Link
                              to={`/user/${userProfile.username}`}
                              className="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                              onClick={() => setIsUserDropdownOpen(false)}
                            >
                              <UserIcon className="w-4 h-4 mr-3 text-white" />
                              View Profile
                            </Link>
                          )}
                          <Link
                            to="/profile-settings"
                            className="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                            onClick={() => setIsUserDropdownOpen(false)}
                          >
                            <Settings className="w-4 h-4 mr-3 text-white" />
                            Settings
                          </Link>
                          <div className="border-t border-slate-700 my-2"></div>
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={onAuthClick}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-700/50">
              <div className="flex flex-col space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search profiles..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {user ? (
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => {
                        onUploadClick()
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </button>

                    {userProfile?.role === "staff" && (
                      <Link
                        to="/moderation"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Moderation Panel</span>
                      </Link>
                    )}

                    {userProfile?.username && (
                      <Link
                        to={`/user/${userProfile.username}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    )}

                    <Link
                      to="/profile-settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
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
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Enhanced Sub Navigation */}
      <nav
        className={`
          bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 sticky top-16 z-40
          transition-transform duration-300 ease-in-out
          ${showSubNav ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto no-scrollbar py-2">
            <Link
              to="/users"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm mr-20 font-medium transition-all ${
                isActive("/users")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Users className="inline h-4 w-4 mr-1" />
              Community
            </Link>
            <Link
              to="/gallery/profiles"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive("/gallery/profiles")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <UserIcon className="inline h-4 w-4 mr-1" />
              Profiles
            </Link>
            <Link
              to="/gallery/pfps"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive("/gallery/pfps")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <ImageIcon className="inline h-4 w-4 mr-1" />
              PFPs
            </Link>
            <Link
              to="/gallery/banners"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive("/gallery/banners")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Layout className="inline h-4 w-4 mr-1" />
              Banners
            </Link>
            <Link
              to="/gallery/emoji-combos"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive("/gallery/emoji-combos")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Smile className="inline h-4 w-4 mr-1" />
              Emoji Combos
            </Link>
            <Link
              to="/gallery/emotes"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive("/gallery/emotes")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Sticker className="inline h-4 w-4 mr-1" />
              Emotes
            </Link>
             <Link
              to="/gallery/wallpapers"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive("/gallery/wallpapers")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <ImageIcon className="inline h-4 w-4 mr-1" />
              Wallpapers
            </Link>
            <Link
              to="/trending"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive("/trending")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <TrendingUp className="inline h-4 w-4 mr-1" />
              Trending
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
