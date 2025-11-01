import { useState } from "react"
import { X } from "lucide-react"
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
    file: null as File | null,
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

  const uploadImage = async (file: File, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) return { error: error.message }

    const { data: { publicUrl } } = supabase.storage
      .from("images")
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
    if (isSubmitting || !emojiForm.file || !emojiForm.name || !emojiForm.combo_text || !user) return

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const cleanFileName = sanitizeFilename(emojiForm.file.name)
      const fileName = `${Date.now()}-emoji-${cleanFileName}`
      const { url, error: uploadError } = await uploadImage(emojiForm.file, fileName)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError || !url) {
        throw new Error(uploadError || "Failed to upload emoji combo")
      }

      const { error: insertError } = await supabase.from("emoji_combos").insert([
        {
          name: emojiForm.name,
          combo_text: emojiForm.combo_text,
          description: emojiForm.description,
          image_url: url,
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
      const { url, error: uploadError } = await uploadImage(emoteForm.file, fileName)

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
      const { url, error: uploadError } = await uploadImage(wallpaperForm.file, fileName)

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-4xl w-full border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            {getModeTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mode Switch Buttons */}
        <div className="flex space-x-4 p-4 border-b border-slate-700">
          <button
            onClick={() => {
              setError(null)
              setUploadMode("single")
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              uploadMode === "single"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
            }`}
          >
            Single Upload
          </button>
          <button
            onClick={() => {
              setError(null)
              setUploadMode("profilePair")
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              uploadMode === "profilePair"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
            }`}
          >
            Profile Pair Upload
          </button>
          <button
            onClick={() => {
              setError(null)
              setUploadMode("emojiCombo")
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              uploadMode === "emojiCombo"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
            }`}
          >
            Emoji Combo Upload
          </button>
          <button
            onClick={() => {
              setError(null)
              setUploadMode("emote")
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              uploadMode === "emote"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
            }`}
          >
            Emote Upload
          </button>
          <button
            onClick={() => {
              setError(null)
              setUploadMode("wallpaper")
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              uploadMode === "wallpaper"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
            }`}
          >
            Wallpaper Upload
          </button>
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
              onFormChange={setSingleForm}
              onFileSelect={(e) => setSingleForm({ ...singleForm, file: e.target.files?.[0] || null })}
              onSubmit={handleSubmitSingle}
              isSubmitting={isSubmitting}
            />
          )}

          {uploadMode === "profilePair" && (
            <ProfilePairUploadForm
              form={pairForm}
              onFormChange={setPairForm}
              onPfpFileSelect={(e) => setPairForm({ ...pairForm, pfpFile: e.target.files?.[0] || null })}
              onBannerFileSelect={(e) => setPairForm({ ...pairForm, bannerFile: e.target.files?.[0] || null })}
              onSubmit={handleSubmitPair}
              isSubmitting={isSubmitting}
            />
          )}

          {uploadMode === "emojiCombo" && (
            <EmojiComboUploadForm
              form={emojiForm}
              onFormChange={setEmojiForm}
              onFileSelect={(e) => setEmojiForm({ ...emojiForm, file: e.target.files?.[0] || null })}
              onSubmit={handleSubmitEmoji}
              isSubmitting={isSubmitting}
            />
          )}

          {uploadMode === "emote" && (
            <EmoteUploadForm
              form={emoteForm}
              onFormChange={setEmoteForm}
              onFileSelect={(e) => setEmoteForm({ ...emoteForm, file: e.target.files?.[0] || null })}
              onSubmit={handleSubmitEmote}
              isSubmitting={isSubmitting}
            />
          )}

          {uploadMode === "wallpaper" && (
            <WallpaperUploadForm
              form={wallpaperForm}
              onFormChange={setWallpaperForm}
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