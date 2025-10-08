import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  Search,
  Users,
  ImageIcon,
  TrendingUp,
  Menu,
  Upload,
  UserIcon,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronUp,
  X,
} from "lucide-react"
import { useAuth } from "../context/authContext"
import { useNotifications } from "../hooks/useNotifications"

export default function MobileBottomNav() {
  const location = useLocation()
  const { user, userProfile, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Close expanded menu when route changes
  useEffect(() => {
    setIsExpanded(false)
    setShowUserMenu(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true
    if (path !== "/" && location.pathname.startsWith(path)) return true
    return false
  }

  const mainNavItems = [
    {
      path: "/",
      icon: Home,
      label: "Home",
      show: true,
    },
    {
      path: "/users",
      icon: Users,
      label: "Community",
      show: true,
    },
    {
      path: "/gallery/profiles",
      icon: ImageIcon,
      label: "Profiles",
      show: true,
    },
    {
      path: "/trending",
      icon: TrendingUp,
      label: "Trending",
      show: true,
    },
  ]

  const userMenuItems = [
    {
      path: "/profile-settings",
      icon: Settings,
      label: "Settings",
      show: true,
    },
    {
      path: "/moderation",
      icon: ShieldCheck,
      label: "Moderation",
      show: userProfile?.role === "admin" || userProfile?.role === "moderator" || userProfile?.role === "staff",
    },
  ]

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Background with blur effect */}
        <div className="bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50">
          {/* Main Navigation */}
          <div className="flex items-center justify-around px-2 py-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                    active
                      ? "text-purple-400 bg-purple-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </Link>
              )
            })}

            {/* User Menu / Upload Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                    showUserMenu
                      ? "text-purple-400 bg-purple-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <div className="relative">
                    <UserIcon className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">Menu</span>
                </button>

                {/* User Menu Dropdown */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden"
                    >
                      {/* User Info Header */}
                      <div className="p-4 border-b border-slate-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            {userProfile?.avatar_url ? (
                              <img
                                src={userProfile.avatar_url}
                                alt="User avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-5 w-5 text-white" />
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

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/upload"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-3 text-sm text-white hover:bg-slate-700 transition-colors"
                        >
                          <Upload className="w-4 h-4 mr-3 text-purple-400" />
                          Upload Content
                        </Link>

                        {userMenuItems.map((item) => {
                          if (!item.show) return null
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center px-4 py-3 text-sm text-white hover:bg-slate-700 transition-colors"
                            >
                              <Icon className="w-4 h-4 mr-3 text-slate-400" />
                              {item.label}
                            </Link>
                          )
                        })}

                        <div className="border-t border-slate-700 my-2"></div>
                        
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                <UserIcon className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">Sign In</span>
              </Link>
            )}
          </div>

          {/* Expanded Menu Toggle */}
          <div className="flex justify-center pb-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronUp className="h-4 w-4 text-slate-400" />
              </motion.div>
            </button>
          </div>
        </div>

        {/* Expanded Menu */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-800/95 backdrop-blur-sm border-t border-slate-700/50 overflow-hidden"
            >
              <div className="px-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/gallery/pfps"
                    className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                    onClick={() => setIsExpanded(false)}
                  >
                    <ImageIcon className="h-5 w-5 text-blue-400" />
                    <span className="text-sm text-white">PFPs</span>
                  </Link>
                  
                  <Link
                    to="/gallery/banners"
                    className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                    onClick={() => setIsExpanded(false)}
                  >
                    <ImageIcon className="h-5 w-5 text-green-400" />
                    <span className="text-sm text-white">Banners</span>
                  </Link>
                  
                  <Link
                    to="/gallery/emotes"
                    className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                    onClick={() => setIsExpanded(false)}
                  >
                    <ImageIcon className="h-5 w-5 text-yellow-400" />
                    <span className="text-sm text-white">Emotes</span>
                  </Link>
                  
                  <Link
                    to="/gallery/emoji-combos"
                    className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                    onClick={() => setIsExpanded(false)}
                  >
                    <ImageIcon className="h-5 w-5 text-pink-400" />
                    <span className="text-sm text-white">Emoji Combos</span>
                  </Link>
                  
                  <Link
                    to="/gallery/wallpapers"
                    className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                    onClick={() => setIsExpanded(false)}
                  >
                    <ImageIcon className="h-5 w-5 text-purple-400" />
                    <span className="text-sm text-white">Wallpapers</span>
                  </Link>
                  
                  <Link
                    to="/search"
                    className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                    onClick={() => setIsExpanded(false)}
                  >
                    <Search className="h-5 w-5 text-cyan-400" />
                    <span className="text-sm text-white">Search</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden"></div>
    </>
  )
}
