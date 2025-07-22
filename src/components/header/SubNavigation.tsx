import { Link } from "react-router-dom"
import { Users, UserIcon, ImageIcon, Layout, Smile, Sticker, TrendingUp } from "lucide-react"

interface SubNavigationProps {
  showSubNav: boolean
  isActive: (path: string) => boolean
}

export default function SubNavigation({ showSubNav, isActive }: SubNavigationProps) {
  return (
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
  )
}