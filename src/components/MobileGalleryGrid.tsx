import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Grid3X3, List, Filter, Search, X, ChevronDown } from "lucide-react"
import MobileGalleryCard from "./MobileGalleryCard"
import MobileTouchOptimized from "./MobileTouchOptimized"

interface MobileGalleryGridProps {
  profiles: any[]
  onPreview: (profile: any) => void
  onDownload: (profile: any) => void
  onToggleFavorite: (profileId: string) => void
  favorites: string[]
  onShare?: (profile: any) => void
  onReport?: (profile: any) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  categories?: string[]
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  isLoading?: boolean
}

export default function MobileGalleryGrid({
  profiles,
  onPreview,
  onDownload,
  onToggleFavorite,
  favorites,
  onShare,
  onReport,
  searchQuery = "",
  onSearchChange,
  categories = [],
  selectedCategory = "all",
  onCategoryChange,
  isLoading = false,
}: MobileGalleryGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSwipeLeft = () => {
    // Could be used for next page or category
  }

  const handleSwipeRight = () => {
    // Could be used for previous page or category
  }

  const handleSwipeUp = () => {
    // Could be used for refresh or load more
  }

  const handleSwipeDown = () => {
    // Could be used for scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const isSticky = scrollPosition > 100

  return (
    <MobileTouchOptimized
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      onSwipeUp={handleSwipeUp}
      onSwipeDown={handleSwipeDown}
      className="min-h-screen bg-slate-900"
    >
      <div className="relative">
        {/* Mobile Header */}
        <motion.div
          className={`sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 ${
            isSticky ? "shadow-lg" : ""
          }`}
          animate={{ y: isSticky ? 0 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search profiles..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>

            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <div className="text-slate-400 text-sm">
                {profiles.length} profiles
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-slate-700/50 bg-slate-800/50"
              >
                <div className="p-4">
                  {/* Categories */}
                  {categories.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-white text-sm font-medium mb-2">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onCategoryChange?.("all")}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${
                            selectedCategory === "all"
                              ? "bg-purple-600 text-white"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          All
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => onCategoryChange?.(category)}
                            className={`px-3 py-1 rounded-full text-xs transition-colors ${
                              selectedCategory === category
                                ? "bg-purple-600 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Gallery Grid */}
        <div ref={gridRef} className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-slate-800 rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-slate-700" />
                  <div className="p-4">
                    <div className="h-4 bg-slate-700 rounded mb-2" />
                    <div className="h-3 bg-slate-700 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : profiles.length > 0 ? (
            <motion.div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-4"
                  : "space-y-4"
              }
              layout
            >
              <AnimatePresence>
                {profiles.map((profile) => (
                  <motion.div
                    key={profile.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={viewMode === "list" ? "flex" : ""}
                  >
                    <MobileGalleryCard
                      profile={profile}
                      onPreview={onPreview}
                      onDownload={onDownload}
                      onToggleFavorite={onToggleFavorite}
                      isFavorited={favorites.includes(profile.id)}
                      onShare={onShare}
                      onReport={onReport}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg mb-2">No profiles found</div>
              <div className="text-slate-500 text-sm">
                Try adjusting your search or filters
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <motion.button
          className="fixed bottom-20 right-4 z-50 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-purple-500/25 transition-all"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ChevronDown className="h-6 w-6 rotate-180" />
        </motion.button>
      </div>
    </MobileTouchOptimized>
  )
}
