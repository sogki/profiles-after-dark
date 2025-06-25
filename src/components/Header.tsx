import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Moon,
  Search,
  Upload,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Settings,
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Search input */}
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

                {/* Profile dropdown container */}
                <div className="relative group">
                  <button
                    className="w-8 h-8 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-400"
                    title="User menu"
                  >
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

                  {/* Dropdown menu */}
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
                    {/* Username */}
                    <div className="px-4 py-2 border-b border-slate-700 text-sm text-slate-300 select-none">
                      Signed in as <br />
                      <span className="font-semibold">
                        {user.email || "User"}
                      </span>
                    </div>

                    <Link
                      to="/profile-settings"
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                      onClick={(e) => e.currentTarget.blur()}
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

          {/* Mobile menu button */}
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

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700/50">
            <div className="flex flex-col space-y-4">
              {/* Mobile Search */}
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
  );
}
