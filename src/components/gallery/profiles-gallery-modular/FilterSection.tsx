import { Dispatch, SetStateAction } from "react"
import { Search, Tag, Palette, Grid3X3, List, Layout } from "lucide-react"

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

interface Profile {
  id: string
  user_id: string
  title: string
  category: string
  type: string
  image_url: string
  download_count: number
  tags: string[]
  created_at: string
  updated_at: string
  text_data: string
}

type GalleryItem = ProfilePair | Profile

interface FilterSectionProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedTags: Set<string>
  setSelectedTags: Dispatch<SetStateAction<Set<string>>>
  selectedColor?: string | "all"
  setSelectedColor?: (color: string | "all") => void
  allTags: string[]
  allColors?: string[]
  profiles: GalleryItem[]
  filteredProfiles: GalleryItem[]
  viewMode: "list" | "grid"
}

export default function FilterSection({
  searchQuery,
  setSearchQuery,
  selectedTags,
  setSelectedTags,
  selectedColor,
  setSelectedColor,
  allTags,
  allColors,
  profiles,
  filteredProfiles,
  viewMode,
}: FilterSectionProps) {
  const toggleTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim()
    setSelectedTags((prev: Set<string>) => {
      const newTags = new Set(prev)
      if (newTags.has(normalizedTag)) {
        newTags.delete(normalizedTag)
      } else {
        newTags.add(normalizedTag)
      }
      return newTags
    })
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-slate-600/50 shadow-2xl">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search titles, categories, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-xl bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-lg backdrop-blur-sm"
            aria-label="Search profiles"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-600 rounded-full transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {allColors && allColors.length > 0 && setSelectedColor && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Palette className="inline h-4 w-4 mr-1" />
              Color
            </label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
            >
              <option value="all">All Colors</option>
              {allColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">View Mode</label>
          <div className="flex rounded-lg bg-slate-700/50 border border-slate-600/50 p-1">
            <button
              disabled={viewMode === "grid"}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-600/50 hover:text-white"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
              Grid
            </button>
            <button
              disabled={viewMode === "list"}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-600/50 hover:text-white"
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        </div>
      </div>

      {allTags.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Tag className="h-4 w-4 text-purple-400" />
              </div>
              <span className="text-lg font-semibold text-white">Filter by tags</span>
            </div>
            {selectedTags.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-slate-400">{selectedTags.size} selected</span>
                <button
                  onClick={() => setSelectedTags(new Set())}
                  className="px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all duration-200 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 20).map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  selectedTags.has(tag)
                    ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25 scale-105"
                    : "bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50 hover:text-white"
                }`}
              >
                #{tag}
              </button>
            ))}
            {allTags.length > 20 && (
              <div className="px-4 py-2 text-sm text-slate-400 bg-slate-700/30 rounded-xl border border-slate-600/30">
                +{allTags.length - 20} more tags
              </div>
            )}
          </div>
        </div>
      )}

      {(searchQuery || selectedTags.size > 0 || selectedColor !== "all") && (
        <div className="mt-6 pt-6 border-t border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Showing {filteredProfiles.length} of {profiles.length} profile combos</span>
            </div>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedTags(new Set())
                setSelectedColor?.("all")
              }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
            >
              Reset all filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}