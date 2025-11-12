import { useState } from "react"
import { X, Image, User, Smile, Monitor } from "lucide-react"
import { BsFillEmojiHeartEyesFill } from "react-icons/bs"
import { useAuth } from "../context/authContext"
import { supabase } from "../lib/supabase"
import SingleUploadForm from "./upload/SingleUploadForm"
import ProfilePairUploadForm from "./upload/ProfilePairUploadForm"
import EmojiComboUploadForm from "./upload/EmojiComboUploadForm"
import EmoteUploadForm from "./upload/EmoteUploadForm"
import WallpaperUploadForm from "./upload/WallpaperUploadForm"

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { user } = useAuth()
  const [uploadMode, setUploadMode] = useState<"single" | "profilePair" | "emojiCombo" | "emote" | "wallpaper">("single")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form states
  const [singleForm, setSingleForm] = useState({
    title: "",
    category: "general" as "discord" | "twitter" | "instagram" | "general",
    type: "profile" as "profile" | "banner",
    tags: [] as string[],
    file: null as File | null,
  })

  const [pairForm, setPairForm] = useState({
    title: "",
    category: "general" as "discord" | "twitter" | "instagram" | "general",
    tags: [] as string[],
    pfpFile: null as File | null,
    bannerFile: null as File | null,
  })

  const [emojiForm, setEmojiForm] = useState({
    name: "",
    combo_text: "",
    description: "",
    tags: [] as string[],
  })

  const [emoteForm, setEmoteForm] = useState({
    title: "",
    category: "general",
    customCategory: "",
    tags: [] as string[],
    file: null as File | null,
  })

  const [wallpaperForm, setWallpaperForm] = useState({
    title: "",
    category: "general",
    customCategory: "",
    resolution: "",
    tags: [] as string[],
    file: null as File | null,
  })

  if (!isOpen) return null

  const sanitizeFilename = (filename: string) => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, "_")
  }

  const uploadImage = async (file: File, fileName: string, bucket: string = "images") => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        })

    if (error) return { error: error.message }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return { url: publicUrl }
  }

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !singleForm.file || !singleForm.title || !user) return

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const cleanFileName = sanitizeFilename(singleForm.file.name)
      const fileName = `${Date.now()}-${singleForm.type}-${cleanFileName}`
      const { url, error: uploadError } = await uploadImage(singleForm.file, fileName)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError || !url) {
        throw new Error(uploadError || "Failed to upload image")
      }

      const { error: insertError } = await supabase.from("single_uploads").insert([
        {
        title: singleForm.title,
        category: singleForm.category,
        type: singleForm.type,
        image_url: url,
        tags: singleForm.tags,
        user_id: user.id,
        },
      ])

      if (insertError) throw new Error(insertError.message)

      onClose()
      setSingleForm({
        title: "",
        category: "general",
        type: "profile",
        tags: [],
        file: null,
      })
      setUploadProgress(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitPair = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !pairForm.pfpFile || !pairForm.bannerFile || !pairForm.title || !user) return

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      // Upload PFP
      const pfpCleanFileName = sanitizeFilename(pairForm.pfpFile.name)
      const pfpFileName = `${Date.now()}-pfp-${pfpCleanFileName}`
      const { url: pfpUrl, error: pfpError } = await uploadImage(pairForm.pfpFile, pfpFileName)

      if (pfpError || !pfpUrl) {
        throw new Error(pfpError || "Failed to upload profile picture")
      }

      // Upload Banner
      const bannerCleanFileName = sanitizeFilename(pairForm.bannerFile.name)
      const bannerFileName = `${Date.now()}-banner-${bannerCleanFileName}`
      const { url: bannerUrl, error: bannerError } = await uploadImage(pairForm.bannerFile, bannerFileName)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (bannerError || !bannerUrl) {
        throw new Error(bannerError || "Failed to upload banner")
      }

      const { error: insertError } = await supabase.from("profile_pairs").insert([
        {
        title: pairForm.title,
        category: pairForm.category,
        pfp_url: pfpUrl,
        banner_url: bannerUrl,
        tags: pairForm.tags,
          user_id: user.id,
        },
      ])

      if (insertError) throw new Error(insertError.message)

      onClose()
      setPairForm({
        title: "",
        category: "general",
        tags: [],
        pfpFile: null,
        bannerFile: null,
      })
      setUploadProgress(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEmoji = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !emojiForm.name || !emojiForm.combo_text || !user) return

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      // Emoji combos don't need image uploads - they're ASCII text
      clearInterval(progressInterval)
      setUploadProgress(100)

      const { error: insertError } = await supabase.from("emoji_combos").insert([
        {
        name: emojiForm.name,
        combo_text: emojiForm.combo_text,
          description: emojiForm.description,
          image_url: null, // Emoji combos are text-based, not images
        tags: emojiForm.tags,
          user_id: user.id,
        },
      ])

      if (insertError) throw new Error(insertError.message)

      onClose()
      setEmojiForm({
        name: "",
        combo_text: "",
        description: "",
        tags: [],
      })
      setUploadProgress(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEmote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !emoteForm.file || !emoteForm.title || !user) return

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const cleanFileName = sanitizeFilename(emoteForm.file.name)
      const fileName = `${Date.now()}-emote-${cleanFileName}`
      const { url, error: uploadError } = await uploadImage(emoteForm.file, fileName, "emotes")

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError || !url) {
        throw new Error(uploadError || "Failed to upload emote")
      }

      const { error: insertError } = await supabase.from("emotes").insert([
        {
          title: emoteForm.title,
          category: emoteForm.category === "custom" ? emoteForm.customCategory : emoteForm.category,
          image_url: url,
          tags: emoteForm.tags,
          user_id: user.id,
        },
      ])

      if (insertError) throw new Error(insertError.message)

      onClose()
      setEmoteForm({
        title: "",
        category: "general",
        customCategory: "",
        tags: [],
        file: null,
      })
      setUploadProgress(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitWallpaper = async (e: React.FormEvent) => {
          e.preventDefault()
    if (isSubmitting || !wallpaperForm.file || !wallpaperForm.title || !user) return

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const cleanFileName = sanitizeFilename(wallpaperForm.file.name)
      const fileName = `${Date.now()}-wallpaper-${cleanFileName}`
      const { url, error: uploadError } = await uploadImage(wallpaperForm.file, fileName, "wallpapers")

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError || !url) {
        throw new Error(uploadError || "Failed to upload wallpaper")
      }

      const { error: insertError } = await supabase.from("wallpapers").insert([
        {
          title: wallpaperForm.title,
          category: wallpaperForm.category === "custom" ? wallpaperForm.customCategory : wallpaperForm.category,
          image_url: url,
          resolution: wallpaperForm.resolution || null,
          tags: wallpaperForm.tags,
          user_id: user.id,
        },
      ])

      if (insertError) throw new Error(insertError.message)

      onClose()
      setWallpaperForm({
        title: "",
        category: "general",
        customCategory: "",
        resolution: "",
        tags: [],
        file: null,
      })
      setUploadProgress(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getModeTitle = () => {
    switch (uploadMode) {
      case "single": return "Upload Single"
      case "profilePair": return "Upload Profile Pair"
      case "emojiCombo": return "Upload Emoji Combo"
      case "emote": return "Upload Emote"
      case "wallpaper": return "Upload Wallpaper"
      default: return "Upload"
    }
  }

  const uploadModes = [
    { id: "single", label: "PFP/Banner", icon: Image },
    { id: "profilePair", label: "Profile Pair", icon: User },
    { id: "emote", label: "Emote", icon: Smile },
    { id: "wallpaper", label: "Wallpaper", icon: Monitor },
    { id: "emojiCombo", label: "Emoji Combo", icon: BsFillEmojiHeartEyesFill },
  ]

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-4xl w-full border border-slate-700 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Upload Content
            </h2>
            <p className="text-sm text-slate-400">
              Choose a content type to get started
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mode Switch Buttons - Improved Layout */}
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {uploadModes.map((mode) => {
              const IconComponent = mode.icon
              const isActive = uploadMode === mode.id
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setError(null)
                    setUploadMode(mode.id as any)
                  }}
                  disabled={isSubmitting}
                  className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30"
                      : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <IconComponent className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="text-xs sm:text-sm text-center">{mode.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Progress Bar */}
        {isSubmitting && (
          <div className="px-6 py-2">
            <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-6 py-2">
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6">
          {uploadMode === "single" && (
            <SingleUploadForm
              form={singleForm}
              onFormChange={(updates) => setSingleForm({ ...singleForm, ...updates })}
              onFileSelect={(e) => setSingleForm({ ...singleForm, file: e.target.files?.[0] || null })}
              onSubmit={handleSubmitSingle}
              isSubmitting={isSubmitting}
            />
                )}

          {uploadMode === "profilePair" && (
            <ProfilePairUploadForm
              form={pairForm}
              onFormChange={(updates) => setPairForm({ ...pairForm, ...updates })}
              onPfpFileSelect={(e) => setPairForm({ ...pairForm, pfpFile: e.target.files?.[0] || null })}
              onBannerFileSelect={(e) => setPairForm({ ...pairForm, bannerFile: e.target.files?.[0] || null })}
              onSubmit={handleSubmitPair}
              isSubmitting={isSubmitting}
            />
          )}

          {uploadMode === "emojiCombo" && (
            <EmojiComboUploadForm
              form={emojiForm}
              onFormChange={(updates) => setEmojiForm({ ...emojiForm, ...updates })}
              onSubmit={handleSubmitEmoji}
              isSubmitting={isSubmitting}
            />
          )}

          {uploadMode === "emote" && (
            <EmoteUploadForm
              form={emoteForm}
              onFormChange={(updates) => setEmoteForm({ ...emoteForm, ...updates })}
              onFileSelect={(e) => setEmoteForm({ ...emoteForm, file: e.target.files?.[0] || null })}
              onSubmit={handleSubmitEmote}
              isSubmitting={isSubmitting}
            />
          )}

          {uploadMode === "wallpaper" && (
            <WallpaperUploadForm
              form={wallpaperForm}
              onFormChange={(updates) => setWallpaperForm({ ...wallpaperForm, ...updates })}
              onFileSelect={(e) => setWallpaperForm({ ...wallpaperForm, file: e.target.files?.[0] || null })}
              onSubmit={handleSubmitWallpaper}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  )
}