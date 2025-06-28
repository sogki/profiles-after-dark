import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Moon,
  Search,
  Upload,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Settings,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { useAuth } from "../context/authContext";

interface HeaderProps {
  onUploadClick: () => void;
  onAuthClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({
  onUploadClick,
  onAuthClick,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showSubNav, setShowSubNav] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 100) {
        setShowSubNav(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShowSubNav(false);
      } else {
        setShowSubNav(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const [notifications, setNotifications] = useState([
    { id: 1, message: "Welcome to Profiles After Dark!", read: false },
    { id: 2, message: "Your upload was approved.", read: false },
    { id: 3, message: "New member joined the community.", read: true },
  ]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="relative">
                <Moon className="h-8 w-8 text-white" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-100 rounded-full animate-pulse"></div>
              </div>
              <div>
                <img
                  src="https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles-after-dark-logomark.png"
                  className="h-8"
                  alt="Profiles After Dark logo"
                />
                <p className="text-xs text-slate-400 hidden sm:block">
                  Aesthetic profiles for the night owls
                </p>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search profiles..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                />
              </div>

              {user ? (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onUploadClick}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </button>

                  <div className="relative group">
                    <button className="w-8 h-8 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-400">
                      {userProfile?.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt="User avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>

                    <div
                      className="
                        absolute right-0 mt-2 w-56 bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5
                        opacity-0 invisible
                        group-hover:visible group-hover:opacity-100
                        transform translate-y-2 group-hover:translate-y-0
                        transition-all duration-200 ease-in-out
                        z-50
                      "
                    >
                      <div className="px-4 py-2 border-b border-slate-700 text-sm text-slate-300 select-none">
                        Signed in as <br />
                        <span className="font-semibold">
                          {user.email || "User"}
                        </span>
                      </div>

                      {userProfile?.role === "staff" && (
                        <Link
                          to="/moderation"
                          className="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Moderation Panel
                        </Link>
                      )}

                      {userProfile?.username && (
                        <Link
                          to={`/user/${userProfile.username}`}
                          className="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          View Profile
                        </Link>
                      )}

                      <Link
                        to="/profile-settings"
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onAuthClick}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white hover:text-purple-400 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

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
                        onUploadClick();
                        setIsMobileMenuOpen(false);
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
                      onAuthClick();
                      setIsMobileMenuOpen(false);
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
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/users")
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Members
            </Link>
            <Link
              to="/gallery/profiles"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/gallery/profiles")
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Profiles
            </Link>
            <Link
              to="/gallery/pfps"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/gallery/pfps")
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              PFPs
            </Link>
            <Link
              to="/gallery/banners"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/gallery/banners")
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Banners
            </Link>
            <Link
              to="/gallery/emoji-combos"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/gallery/emoji-combos")
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Emoji Combos
            </Link>
            <Link
              to="/gallery/emotes"
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/gallery/emotes")
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Emotes
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
