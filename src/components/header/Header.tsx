import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Bell, Menu, Upload, UserIcon, X } from "lucide-react"
import { useAuth } from "../../context/authContext"
import { useNotifications } from "../../hooks/useNotifications"
import NotificationCenter from "./../NotificationCenter"
import Logo from "./Logo"
import SearchBar from "./SearchBar"
import UserDropdown from "./UserDropdown"
import MobileMenu from "./MobileMenu"
import SubNavigation from "./SubNavigation"
import { User } from "@supabase/supabase-js"

interface HeaderProps {
  onUploadClick: () => void
  onAuthClick: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  user: User | null
}

export default function Header({ onUploadClick, onAuthClick, searchQuery, onSearchChange, user }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSubNav, setShowSubNav] = useState(true)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const lastScrollY = useRef(0)
  const { unreadCount } = useNotifications()
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const notificationCenterRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationCenterRef.current && !notificationCenterRef.current.contains(event.target as Node)) {
        setIsNotificationCenterOpen(false)
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

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
    setIsMobileMenuOpen(false)
    setIsUserDropdownOpen(false)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        ref={notificationCenterRef}
      />
      
      <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            
            <div className="hidden md:flex items-center space-x-6">
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                searchRef={searchRef}
                showSearchSuggestions={showSearchSuggestions}
                setShowSearchSuggestions={setShowSearchSuggestions}
              />
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onUploadClick}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </button>
                  
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
                  
                  <UserDropdown
                    userDropdownRef={userDropdownRef}
                    isUserDropdownOpen={isUserDropdownOpen}
                    setIsUserDropdownOpen={setIsUserDropdownOpen}
                    handleSignOut={handleSignOut}
                  />
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
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          
          <MobileMenu
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            onUploadClick={onUploadClick}
            onAuthClick={onAuthClick}
            handleSignOut={handleSignOut}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
          />
        </div>
      </header>
      
      <SubNavigation showSubNav={showSubNav} isActive={isActive} />
    </>
  )
}