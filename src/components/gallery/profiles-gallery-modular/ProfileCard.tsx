import { Download, Heart, Eye } from "lucide-react"
import { User } from "@supabase/supabase-js"

interface ProfilePair {
  id: string
  user_id?: string
  title: string
  category?: string
  tags?: string[]
  pfp_url: string
  banner_url: string
  download_count?: number
  created_at?: string
  updated_at?: string
  color?: string
  type: "pair"
}

interface ProfileCardProps {
  profile: ProfilePair
  viewMode: "list" | "grid"
  favorites: Set<string>
  handleDownloadBoth: (profile: ProfilePair) => Promise<void>
  handleFavorite: (profileId: string) => void
  openPreview: (profile: ProfilePair) => void
  user: User | null
}

export default function ProfileCard({
  profile,
  viewMode,
  favorites,
  handleDownloadBoth,
  handleFavorite,
  openPreview,
  user,
}: ProfileCardProps) {
  return (
    <div
      className={`relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 border border-slate-700 ${
        viewMode === "grid" ? "flex flex-col" : "flex flex-row items-center"
      }`}
    >
      <div
        className={`relative ${
          viewMode === "grid" ? "h-48" : "h-24 w-32 flex-shrink-0"
        } bg-gradient-to-br from-slate-700 to-slate-900`}
      >
        <img
          src={profile.pfp_url}
          alt={`${profile.title} PFP`}
          className={`absolute inset-0 object-cover ${
            viewMode === "grid" ? "h-full w-full" : "h-24 w-24 rounded-full m-2"
          }`}
        />
        {viewMode === "grid" && (
          <img
            src={profile.banner_url}
            alt={`${profile.title} Banner`}
            className="absolute inset-0 h-20 w-full object-cover opacity-30"
          />
        )}
      </div>

      <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
        <h3 className="text-lg font-semibold text-white truncate">{profile.title}</h3>
        <p className="text-sm text-gray-400">
          {profile.category || "General"} • {profile.download_count || 0} downloads
        </p>
        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {profile.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{profile.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div
        className={`absolute ${
          viewMode === "grid" ? "bottom-4 right-4" : "top-4 right-4"
        } flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      >
        <button
          onClick={() => openPreview(profile)}
          className="p-2 bg-slate-900/80 rounded-full hover:bg-slate-700 transition-colors"
          aria-label="Preview profile"
        >
          <Eye className="h-4 w-4 text-white" />
        </button>
        <button
          onClick={() => handleDownloadBoth(profile)}
          className="p-2 bg-slate-900/80 rounded-full hover:bg-slate-700 transition-colors"
          aria-label="Download both images"
        >
          <Download className="h-4 w-4 text-white" />
        </button>
        {user && (
          <button
            onClick={() => handleFavorite(profile.id)}
            className={`p-2 rounded-full transition-colors ${
              favorites.has(profile.id)
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-slate-900/80 hover:bg-slate-700"
            }`}
            aria-label={favorites.has(profile.id) ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-4 w-4 ${
                favorites.has(profile.id) ? "text-white fill-white" : "text-white"
              }`}
            />
          </button>
        )}
      </div>
    </div>
  )
}