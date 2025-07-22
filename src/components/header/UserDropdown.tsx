import { Link } from "react-router-dom"
import { ChevronDown, ShieldCheck, UserIcon, Settings, LogOut } from "lucide-react"
import { useAuth } from "../../context/authContext"

interface UserDropdownProps {
  userDropdownRef: React.RefObject<HTMLDivElement>
  isUserDropdownOpen: boolean
  setIsUserDropdownOpen: (open: boolean) => void
  handleSignOut: () => void
}

export default function UserDropdown({ userDropdownRef, isUserDropdownOpen, setIsUserDropdownOpen, handleSignOut }: UserDropdownProps) {
  const { user, userProfile } = useAuth()

  return (
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
                <p className="text-xs text-slate-400 truncate">
                  {user ? user.email : "No email"}
                </p>
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
  )
}