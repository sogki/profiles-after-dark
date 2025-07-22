import { Link } from "react-router-dom"
import { Search, Upload, UserIcon, Settings, LogOut, ShieldCheck } from "lucide-react"
import { useAuth } from "../../context/authContext"

interface MobileMenuProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  onUploadClick: () => void
  onAuthClick: () => void
  handleSignOut: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function MobileMenu({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onUploadClick,
  onAuthClick,
  handleSignOut,
  searchQuery,
  onSearchChange,
}: MobileMenuProps) {
  const { user, userProfile } = useAuth()

  if (!isMobileMenuOpen) return null

  return (
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
  )
}