import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, Heart, Eye, Share2, MoreHorizontal, X } from "lucide-react"
import MobileTouchOptimized from "./MobileTouchOptimized"

interface MobileGalleryCardProps {
  profile: {
    id: string
    title: string
    image_url?: string
    pfp_url?: string
    banner_url?: string
    download_count?: number
    tags?: string[]
    type?: string
  }
  onPreview: (profile: any) => void
  onDownload: (profile: any) => void
  onToggleFavorite: (profileId: string) => void
  isFavorited: boolean
  onShare?: (profile: any) => void
  onReport?: (profile: any) => void
}

export default function MobileGalleryCard({
  profile,
  onPreview,
  onDownload,
  onToggleFavorite,
  isFavorited,
  onShare,
  onReport,
}: MobileGalleryCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const getImageUrl = () => {
    if (profile.type === "pair" && profile.banner_url) {
      return profile.banner_url
    }
    return profile.image_url || profile.pfp_url || ""
  }

  const handleSwipeUp = () => {
    setShowActions(true)
  }

  const handleSwipeDown = () => {
    setShowActions(false)
  }

  const handleTap = () => {
    onPreview(profile)
  }

  const handleLongPress = () => {
    setShowActions(true)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload(profile)
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite(profile.id)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShare) {
      onShare(profile)
    }
  }

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onReport) {
      onReport(profile)
    }
  }

  return (
    <MobileTouchOptimized
      onSwipeUp={handleSwipeUp}
      onSwipeDown={handleSwipeDown}
      onTap={handleTap}
      onLongPress={handleLongPress}
      className="relative"
    >
      <motion.div
        ref={cardRef}
        className="relative bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-700"
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          {!imageError && getImageUrl() ? (
            <img
              src={getImageUrl()}
              alt={profile.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isImageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-slate-700 flex items-center justify-center">
              <div className="text-slate-400 text-sm">No image</div>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Quick Actions Overlay */}
          <div className="absolute top-2 right-2 flex space-x-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleFavorite}
              className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                isFavorited
                  ? "bg-red-500/80 text-white"
                  : "bg-black/50 text-white hover:bg-red-500/80"
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-all"
            >
              <MoreHorizontal className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Download Count */}
          {profile.download_count && profile.download_count > 0 && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
              <Download className="inline h-3 w-3 mr-1" />
              {profile.download_count}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
            {profile.title}
          </h3>

          {/* Tags */}
          {profile.tags && profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {profile.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {profile.tags.length > 3 && (
                <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded-full">
                  +{profile.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleTap}
              className="px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-all"
            >
              <Eye className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Expanded Actions Panel */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm flex flex-col justify-center items-center space-y-4 p-6"
            >
              <button
                onClick={() => setShowActions(false)}
                className="absolute top-4 right-4 p-2 text-white hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                <h3 className="text-white font-medium text-lg mb-2">{profile.title}</h3>
                <p className="text-slate-400 text-sm">Choose an action</p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  <Download className="h-6 w-6" />
                  <span className="text-sm font-medium">Download</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTap}
                  className="flex flex-col items-center space-y-2 p-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
                >
                  <Eye className="h-6 w-6" />
                  <span className="text-sm font-medium">Preview</span>
                </motion.button>

                {onShare && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="flex flex-col items-center space-y-2 p-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
                  >
                    <Share2 className="h-6 w-6" />
                    <span className="text-sm font-medium">Share</span>
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFavorite}
                  className={`flex flex-col items-center space-y-2 p-4 rounded-xl transition-all ${
                    isFavorited
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-slate-700 text-white hover:bg-slate-600"
                  }`}
                >
                  <Heart className={`h-6 w-6 ${isFavorited ? "fill-current" : ""}`} />
                  <span className="text-sm font-medium">
                    {isFavorited ? "Favorited" : "Favorite"}
                  </span>
                </motion.button>
              </div>

              {onReport && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReport}
                  className="px-4 py-2 text-red-400 text-sm hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Report Content
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MobileTouchOptimized>
  )
}
