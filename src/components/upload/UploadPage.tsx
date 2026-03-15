import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Image, User, Smile, Monitor, ArrowLeft, FolderKanban } from "lucide-react"
import { BsFillEmojiHeartEyesFill } from "react-icons/bs"
import { useAuth } from "../../context/authContext"
import { supabase } from "../../lib/supabase"
import { assertCanUpload, getUploadQuota, type UploadQuota } from "../../lib/uploadLimits"
import SingleUploadForm from "./SingleUploadForm"
import ProfilePairUploadForm from "./ProfilePairUploadForm"
import EmojiComboUploadForm from "./EmojiComboUploadForm"
import EmoteUploadForm from "./EmoteUploadForm"
import WallpaperUploadForm from "./WallpaperUploadForm"
import CollectionUploadForm from "./CollectionUploadForm"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"
import { assertCanCreateCollection, getCollectionQuota } from "@/lib/collectionLimits"
import { getUserCollectionContentOptions } from "@/lib/collectionContent"
import { sendDiscordBotLogEvent } from "../../lib/discordBotApi"

type UploadMode = "single" | "profilePair" | "emojiCombo" | "emote" | "wallpaper" | "collection"

export default function UploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [uploadMode, setUploadMode] = useState<UploadMode>("single")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [uploadQuota, setUploadQuota] = useState<UploadQuota | null>(null)
  const [loadingQuota, setLoadingQuota] = useState(false)
  const [collectionQuota, setCollectionQuota] = useState<{ isPremium: boolean; used: number; remaining: number } | null>(null)
  const [collectionOptions, setCollectionOptions] = useState<Array<{ id: string; name: string; image_url: string; content_type?: string }>>([])

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
  const [collectionForm, setCollectionForm] = useState({
    name: "",
    description: "",
    is_public: true,
    emote_ids: [] as string[],
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/")
      toast.error("Please sign in to upload content")
    }
  }, [user, navigate])

  // Reset success message when mode changes
  useEffect(() => {
    setSuccess(false)
    setError(null)
  }, [uploadMode])

  const refreshQuota = async () => {
    if (!user) return
    try {
      setLoadingQuota(true)
      const [quota, collection] = await Promise.all([getUploadQuota(user.id), getCollectionQuota(user.id)])
      setUploadQuota(quota)
      setCollectionQuota({
        isPremium: collection.isPremium,
        used: collection.used,
        remaining: collection.remaining,
      })
    } catch (err) {
      console.error("Failed to fetch upload quota:", err)
    } finally {
      setLoadingQuota(false)
    }
  }

  useEffect(() => {
    refreshQuota()
  }, [user])

  useEffect(() => {
    const fetchCollectionOptions = async () => {
      if (!user) return
      const options = await getUserCollectionContentOptions(user.id)
      setCollectionOptions(options)
    }
    fetchCollectionOptions()
  }, [user])

  const sanitizeFilename = (filename: string) => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, "_")
  }

  const uploadImage = async (file: File, fileName: string, bucket: string = "avatars") => {
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

  const resetForm = (mode: UploadMode) => {
    switch (mode) {
      case "single":
        setSingleForm({
          title: "",
          category: "general",
          type: "profile",
          tags: [],
          file: null,
        })
        break
      case "profilePair":
        setPairForm({
          title: "",
          category: "general",
          tags: [],
          pfpFile: null,
          bannerFile: null,
        })
        break
      case "emojiCombo":
        setEmojiForm({
          name: "",
          combo_text: "",
          description: "",
          tags: [],
        })
        break
      case "emote":
        setEmoteForm({
          title: "",
          category: "general",
          customCategory: "",
          tags: [],
          file: null,
        })
        break
      case "wallpaper":
        setWallpaperForm({
          title: "",
          category: "general",
          customCategory: "",
          resolution: "",
          tags: [],
          file: null,
        })
        break
      case "collection":
        setCollectionForm({
          name: "",
          description: "",
          is_public: true,
          emote_ids: [],
        })
        break
    }
  }

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !singleForm.file || !singleForm.title || !user) return

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)
    setSuccess(false)

    try {
      const uploadCost = singleForm.type === "profile" ? 2 : 1
      await assertCanUpload(user.id, uploadCost)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const cleanFileName = sanitizeFilename(singleForm.file.name)
      const fileName = `${user.id}/${Date.now()}-${singleForm.type}-${cleanFileName}`
      const targetBucket = singleForm.type === "profile" ? "avatars" : "banners"
      const { url, error: uploadError } = await uploadImage(singleForm.file, fileName, targetBucket)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError || !url) {
        throw new Error(uploadError || "Failed to upload image")
      }

      const { error: insertError } = await supabase.from("profiles").insert([
        {
          title: singleForm.title,
          category: singleForm.category,
          type: singleForm.type,
          image_url: url,
          tags: singleForm.tags,
          user_id: user.id,
          status: "pending",
        },
      ])

      if (insertError) throw new Error(insertError.message)

      await sendDiscordBotLogEvent({
        eventType: "content_submission",
        title: "New Content Submission",
        description: `${singleForm.type === "profile" ? "Profile" : "Banner"} submission created and awaiting review.`,
        fields: [
          { name: "Title", value: singleForm.title, inline: true },
          { name: "Type", value: singleForm.type, inline: true },
          { name: "User ID", value: user.id, inline: true },
        ],
        visibility: "staff",
      }).catch(() => undefined)

      toast.success("Upload successful!")
      setSuccess(true)
      resetForm("single")
      setUploadProgress(0)
      await refreshQuota()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
      toast.error(err instanceof Error ? err.message : "Upload failed")
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
    setSuccess(false)

    try {
      await assertCanUpload(user.id, 2)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      // Upload PFP
      const pfpCleanFileName = sanitizeFilename(pairForm.pfpFile.name)
      const pfpFileName = `${user.id}/${Date.now()}-pfp-${pfpCleanFileName}`
      const { url: pfpUrl, error: pfpError } = await uploadImage(pairForm.pfpFile, pfpFileName, "avatars")

      if (pfpError || !pfpUrl) {
        throw new Error(pfpError || "Failed to upload profile picture")
      }

      // Upload Banner
      const bannerCleanFileName = sanitizeFilename(pairForm.bannerFile.name)
      const bannerFileName = `${user.id}/${Date.now()}-banner-${bannerCleanFileName}`
      const { url: bannerUrl, error: bannerError } = await uploadImage(pairForm.bannerFile, bannerFileName, "banners")

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
          status: "pending",
        },
      ])

      if (insertError) throw new Error(insertError.message)

      await sendDiscordBotLogEvent({
        eventType: "content_submission",
        title: "New Profile Pair Submission",
        description: "A profile pair submission is awaiting moderation review.",
        fields: [
          { name: "Title", value: pairForm.title, inline: true },
          { name: "User ID", value: user.id, inline: true },
          { name: "Category", value: pairForm.category, inline: true },
        ],
        visibility: "staff",
      }).catch(() => undefined)

      toast.success("Profile pair uploaded successfully!")
      setSuccess(true)
      resetForm("profilePair")
      setUploadProgress(0)
      await refreshQuota()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
      toast.error(err instanceof Error ? err.message : "Upload failed")
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
    setSuccess(false)

    try {
      await assertCanUpload(user.id, 1)

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
          status: "pending",
        },
      ])

      if (insertError) throw new Error(insertError.message)

      await sendDiscordBotLogEvent({
        eventType: "content_submission",
        title: "New Emoji Combo Submission",
        description: "A new emoji combo was submitted for review.",
        fields: [
          { name: "Name", value: emojiForm.name, inline: true },
          { name: "User ID", value: user.id, inline: true },
          { name: "Preview", value: emojiForm.combo_text.slice(0, 80) || "-", inline: false },
        ],
        visibility: "staff",
      }).catch(() => undefined)

      toast.success("Emoji combo uploaded successfully!")
      setSuccess(true)
      resetForm("emojiCombo")
      setUploadProgress(0)
      await refreshQuota()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
      toast.error(err instanceof Error ? err.message : "Upload failed")
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
    setSuccess(false)

    try {
      await assertCanUpload(user.id, 1)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const cleanFileName = sanitizeFilename(emoteForm.file.name)
      const fileName = `${user.id}/${Date.now()}-emote-${cleanFileName}`
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
          status: "pending",
        },
      ])

      if (insertError) throw new Error(insertError.message)

      await sendDiscordBotLogEvent({
        eventType: "content_submission",
        title: "New Emote Submission",
        description: "A new emote was submitted and is pending moderation.",
        fields: [
          { name: "Title", value: emoteForm.title, inline: true },
          { name: "Category", value: emoteForm.category, inline: true },
          { name: "User ID", value: user.id, inline: true },
        ],
        visibility: "staff",
      }).catch(() => undefined)

      toast.success("Emote uploaded successfully!")
      setSuccess(true)
      resetForm("emote")
      setUploadProgress(0)
      await refreshQuota()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
      toast.error(err instanceof Error ? err.message : "Upload failed")
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
    setSuccess(false)

    try {
      await assertCanUpload(user.id, 1)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const cleanFileName = sanitizeFilename(wallpaperForm.file.name)
      const fileName = `${user.id}/${Date.now()}-wallpaper-${cleanFileName}`
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
          status: "pending",
        },
      ])

      if (insertError) throw new Error(insertError.message)

      await sendDiscordBotLogEvent({
        eventType: "content_submission",
        title: "New Wallpaper Submission",
        description: "A new wallpaper was submitted and is pending moderation.",
        fields: [
          { name: "Title", value: wallpaperForm.title, inline: true },
          { name: "Category", value: wallpaperForm.category, inline: true },
          { name: "User ID", value: user.id, inline: true },
        ],
        visibility: "staff",
      }).catch(() => undefined)

      toast.success("Wallpaper uploaded successfully!")
      setSuccess(true)
      resetForm("wallpaper")
      setUploadProgress(0)
      await refreshQuota()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !user) return
    if (!collectionForm.name.trim()) {
      setError("Collection name is required")
      return
    }
    if (collectionForm.emote_ids.length === 0) {
      setError("Select at least one emote for the collection")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)
    setSuccess(false)

    try {
      await assertCanCreateCollection(user.id)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 20, 90))
      }, 200)

      const { error: insertError } = await supabase.from("flair_emote_collections").insert([
        {
          user_id: user.id,
          name: collectionForm.name.trim(),
          description: collectionForm.description.trim() || null,
          emote_ids: collectionForm.emote_ids,
          is_public: collectionForm.is_public,
          is_active: true,
        },
      ])

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (insertError) throw new Error(insertError.message)

      toast.success("Collection created successfully!")
      setSuccess(true)
      resetForm("collection")
      setUploadProgress(0)
      await refreshQuota()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection")
      setUploadProgress(0)
      toast.error(err instanceof Error ? err.message : "Failed to create collection")
    } finally {
      setIsSubmitting(false)
    }
  }

  const uploadModes = [
    { id: "single" as UploadMode, label: "PFP/Banner", icon: Image, description: "Upload a single profile picture or banner" },
    { id: "profilePair" as UploadMode, label: "Profile Pair", icon: User, description: "Upload a matching PFP and banner pair" },
    { id: "emote" as UploadMode, label: "Emote", icon: Smile, description: "Upload custom emotes" },
    { id: "wallpaper" as UploadMode, label: "Wallpaper", icon: Monitor, description: "Upload wallpapers" },
    { id: "emojiCombo" as UploadMode, label: "Emoji Combo", icon: BsFillEmojiHeartEyesFill, description: "Share ASCII art and emoji combos" },
    { id: "collection" as UploadMode, label: "Collection", icon: FolderKanban, description: "Create flair emote collections" },
  ]

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Upload Content</h1>
          <p className="text-slate-400">Share your creations with the community</p>
        </div>

        {uploadQuota && (
          <div className="mb-6 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-slate-200">
                Upload quota:{" "}
                <span className="font-semibold text-white">
                  {uploadQuota.isPremium ? "Unlimited (Premium)" : `${uploadQuota.used}/${uploadQuota.quota}`}
                </span>
                {!uploadQuota.isPremium && (
                  <span className="text-slate-400"> ({uploadQuota.remaining} remaining)</span>
                )}
              </p>
            </div>
          </div>
        )}

        {collectionQuota && (
          <div className="mb-6 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-sm">
            <p className="text-slate-200">
              Collection quota:{" "}
              <span className="font-semibold text-white">
                {collectionQuota.isPremium ? "Unlimited (Premium)" : `${collectionQuota.used}/3`}
              </span>
              {!collectionQuota.isPremium && (
                <span className="text-slate-400"> ({collectionQuota.remaining} remaining)</span>
              )}
            </p>
          </div>
        )}

        {loadingQuota && !uploadQuota && (
          <div className="mb-6 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-sm text-slate-400">
            Loading upload quota...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sticky top-8">
              <h2 className="text-lg font-semibold text-white mb-4">Content Types</h2>
              <div className="space-y-2">
                {uploadModes.map((mode) => {
                  const IconComponent = mode.icon
                  const isActive = uploadMode === mode.id
                  return (
                    <motion.button
                      key={mode.id}
                      onClick={() => {
                        setError(null)
                        setSuccess(false)
                        setUploadMode(mode.id)
                      }}
                      disabled={isSubmitting}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      whileHover={!isSubmitting && !isActive ? { scale: 1.02 } : {}}
                      whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                    >
                      <IconComponent className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{mode.label}</div>
                        <div className="text-xs opacity-75 hidden sm:block">{mode.description}</div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg">
              {/* Progress Bar */}
              {isSubmitting && (
                <div className="px-6 py-4 border-b border-slate-700/50">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">{uploadProgress}%</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="px-6 py-4 border-b border-slate-700/50">
                  <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                    Upload successful! You can upload another item or go back.
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="px-6 py-4 border-b border-slate-700/50">
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

                {uploadMode === "collection" && (
                  <CollectionUploadForm
                    form={collectionForm}
                    items={collectionOptions}
                    onFormChange={(updates) => setCollectionForm({ ...collectionForm, ...updates })}
                    onSubmit={handleSubmitCollection}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

