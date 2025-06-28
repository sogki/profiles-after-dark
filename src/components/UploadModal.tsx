import type React from "react"
import { useState } from "react"
import { X, Upload, ImageIcon, Loader, Camera, Plus, Check } from "lucide-react"
import { useProfiles } from "../hooks/useProfiles"
import { useAuth } from "../context/authContext"

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  // Which upload form is active? 'single' or 'profilePair'
  const [uploadMode, setUploadMode] = useState<"single" | "profilePair">("single")

  // Single upload form state
  const [singleForm, setSingleForm] = useState({
    title: "",
    category: "general" as "discord" | "twitter" | "instagram" | "general",
    type: "profile" as "profile" | "banner",
    tags: [] as string[],
    file: null as File | null,
  })

  // Profile pair upload form state
  const [pairForm, setPairForm] = useState({
    title: "",
    category: "general" as "discord" | "twitter" | "instagram" | "general",
    tags: [] as string[],
    pfpFile: null as File | null,
    bannerFile: null as File | null,
  })

  // Common states
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [tagInput, setTagInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { uploadProfile, uploadImage, uploadProfilePair } = useProfiles()
  const { user } = useAuth()

  if (!isOpen) return null

  // Drag handlers for single file upload (reused for both single & pair, separate file inputs)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  // Single form handlers
  const handleSingleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File is too large. Maximum size is 10MB.")
        return
      }
      setSingleForm({ ...singleForm, file })
      setError(null)
    }
  }

  // Profile pair handlers
  const handlePfpFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File is too large. Maximum size is 10MB.")
        return
      }
      setPairForm({ ...pairForm, pfpFile: file })
      setError(null)
    }
  }

  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File is too large. Maximum size is 10MB.")
        return
      }
      setPairForm({ ...pairForm, bannerFile: file })
      setError(null)
    }
  }

  // Tag add/remove helpers for single or pair
  const addTag = () => {
    const currentTags = uploadMode === "single" ? singleForm.tags : pairForm.tags

    if (currentTags.length >= 10) {
      setError("Maximum 10 tags allowed")
      return
    }

    if (uploadMode === "single") {
      if (tagInput.trim() && !singleForm.tags.includes(tagInput.trim())) {
        setSingleForm({
          ...singleForm,
          tags: [...singleForm.tags, tagInput.trim()],
        })
        setTagInput("")
        setError(null)
      }
    } else {
      if (tagInput.trim() && !pairForm.tags.includes(tagInput.trim())) {
        setPairForm({
          ...pairForm,
          tags: [...pairForm.tags, tagInput.trim()],
        })
        setTagInput("")
        setError(null)
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    if (uploadMode === "single") {
      setSingleForm({
        ...singleForm,
        tags: singleForm.tags.filter((tag) => tag !== tagToRemove),
      })
    } else {
      setPairForm({
        ...pairForm,
        tags: pairForm.tags.filter((tag) => tag !== tagToRemove),
      })
    }
  }

  // Submission handlers
  const sanitizeFilename = (name: string) => name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "")

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!singleForm.file || !singleForm.title || !user) return

    if (singleForm.file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const cleanFileName = sanitizeFilename(singleForm.file.name)
      const fileName = `${Date.now()}-${cleanFileName}`

      const { url, error: uploadError } = await uploadImage(singleForm.file, fileName)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError || !url) {
        throw new Error(uploadError || "Failed to upload image")
      }

      const { error: profileError } = await uploadProfile({
        title: singleForm.title,
        category: singleForm.category,
        type: singleForm.type,
        image_url: url,
        tags: singleForm.tags,
        user_id: user.id,
      })

      if (profileError) throw new Error(profileError)

      // reset form and close
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
    if (isSubmitting) return

    if (!pairForm.pfpFile || !pairForm.bannerFile || !pairForm.title || !user) return

    if (pairForm.pfpFile.size > 10 * 1024 * 1024 || pairForm.bannerFile.size > 10 * 1024 * 1024) {
      setError("One or both files are too large. Maximum size is 10MB each.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 90))
      }, 300)

      // Upload PFP
      const cleanPfpName = sanitizeFilename(pairForm.pfpFile.name)
      const pfpFileName = `${Date.now()}-pfp-${cleanPfpName}`

      const { url: pfpUrl, error: pfpUploadError } = await uploadImage(pairForm.pfpFile, pfpFileName)

      if (pfpUploadError || !pfpUrl) throw new Error(pfpUploadError || "Failed to upload profile picture")

      // Upload Banner
      const cleanBannerName = sanitizeFilename(pairForm.bannerFile.name)
      const bannerFileName = `${Date.now()}-banner-${cleanBannerName}`

      const { url: bannerUrl, error: bannerUploadError } = await uploadImage(pairForm.bannerFile, bannerFileName)

      if (bannerUploadError || !bannerUrl) throw new Error(bannerUploadError || "Failed to upload banner")

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Create profile pair record (assuming uploadProfilePair handles pair creation)
      const { error: pairError } = await uploadProfilePair({
        title: pairForm.title,
        category: pairForm.category,
        user_id: user.id,
        pfp_url: pfpUrl,
        banner_url: bannerUrl,
        tags: pairForm.tags,
      })

      if (pairError) throw new Error(pairError)

      // reset form and close
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

  const FileUploadArea = ({
    file,
    onFileSelect,
    inputId,
    label,
    icon: Icon = Upload,
    compact = false,
  }: {
    file: File | null
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
    inputId: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    compact?: boolean
  }) => (
    <div>
      <label className="block text-sm font-medium text-white mb-2">{label}</label>
      <div
        className={`relative border-2 border-dashed rounded-lg text-center transition-all duration-200 ${
          compact ? "p-4" : "p-6"
        } ${
          dragActive
            ? "border-purple-500 bg-purple-500/10 scale-105"
            : file
              ? "border-green-500 bg-green-500/10"
              : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          const files = Array.from(e.dataTransfer.files)
          if (files.length > 0 && files[0].type.startsWith("image/")) {
            const mockEvent = {
              target: { files: [files[0]] },
            } as React.ChangeEvent<HTMLInputElement>
            onFileSelect(mockEvent)
          }
        }}
      >
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Check className={`${compact ? "w-8 h-8" : "w-12 h-12"} text-green-500 mx-auto animate-pulse`} />
            </div>
            <span className={`${compact ? "text-xs" : "text-sm"} text-green-400 font-medium truncate max-w-full`}>
              {file.name}
            </span>
            <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        ) : (
          <>
            <Icon className={`${compact ? "w-8 h-8" : "w-12 h-12"} mx-auto text-slate-400 mb-2`} />
            <p className={`${compact ? "text-xs" : "text-sm"} text-slate-400`}>
              Drag and drop or{" "}
              <label
                htmlFor={inputId}
                className="text-purple-400 cursor-pointer underline hover:text-purple-300 transition-colors"
              >
                browse files
              </label>
            </p>
            <input id={inputId} type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-4xl w-full border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            {uploadMode === "single" ? "Upload Single" : "Upload Profile Pair"}
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
              setTagInput("")
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
              setTagInput("")
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              uploadMode === "profilePair"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
            }`}
          >
            Profile Pair Upload
          </button>
        </div>

        {/* Progress Bar */}
        {isSubmitting && (
          <div className="px-6 py-2 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-sm text-slate-400">{uploadProgress}%</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mx-6 mt-4">
            {error}
          </div>
        )}

        {/* Form Content */}
        <div className="p-6">
          {uploadMode === "single" ? (
            <form onSubmit={handleSubmitSingle} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* File Upload */}
                <FileUploadArea
                  file={singleForm.file}
                  onFileSelect={handleSingleFileSelect}
                  inputId="singleFileInput"
                  label="Upload Image"
                  icon={singleForm.type === "profile" ? Camera : ImageIcon}
                />

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label htmlFor="singleTitle" className="block text-sm font-medium text-white mb-2">
                      Title
                    </label>
                    <input
                      id="singleTitle"
                      type="text"
                      value={singleForm.title}
                      onChange={(e) => setSingleForm({ ...singleForm, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter a descriptive title"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="singleCategory" className="block text-sm font-medium text-white mb-2">
                      Category
                    </label>
                    <select
                      id="singleCategory"
                      value={singleForm.category}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          category: e.target.value as "discord" | "twitter" | "instagram" | "general",
                        })
                      }
                      className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="general">General</option>
                      <option value="discord">Discord</option>
                      <option value="twitter">Twitter</option>
                      <option value="instagram">Instagram</option>
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Type</label>
                    <select
                      value={singleForm.type}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          type: e.target.value as "profile" | "banner",
                        })
                      }
                      className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="profile">Profile Picture</option>
                      <option value="banner">Banner Image</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Tags ({singleForm.tags.length}/10)</label>
                {singleForm.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {singleForm.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-300 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-800 p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    disabled={singleForm.tags.length >= 10}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={singleForm.tags.length >= 10}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 rounded-lg text-white transition-all duration-200 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !singleForm.file || !singleForm.title}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin w-5 h-5" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload {singleForm.type === "profile" ? "Profile" : "Banner"}
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitPair} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* PFP Upload */}
                <FileUploadArea
                  file={pairForm.pfpFile}
                  onFileSelect={handlePfpFileSelect}
                  inputId="pfpFileInput"
                  label="Profile Picture"
                  icon={Camera}
                  compact
                />

                {/* Banner Upload */}
                <FileUploadArea
                  file={pairForm.bannerFile}
                  onFileSelect={handleBannerFileSelect}
                  inputId="bannerFileInput"
                  label="Banner Image"
                  icon={ImageIcon}
                  compact
                />

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label htmlFor="pairTitle" className="block text-sm font-medium text-white mb-2">
                      Title
                    </label>
                    <input
                      id="pairTitle"
                      type="text"
                      value={pairForm.title}
                      onChange={(e) => setPairForm({ ...pairForm, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter pair title"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="pairCategory" className="block text-sm font-medium text-white mb-2">
                      Category
                    </label>
                    <select
                      id="pairCategory"
                      value={pairForm.category}
                      onChange={(e) =>
                        setPairForm({
                          ...pairForm,
                          category: e.target.value as "discord" | "twitter" | "instagram" | "general",
                        })
                      }
                      className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="general">General</option>
                      <option value="discord">Discord</option>
                      <option value="twitter">Twitter</option>
                      <option value="instagram">Instagram</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Tags ({pairForm.tags.length}/10)</label>
                {pairForm.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {pairForm.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-300 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-800 p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    disabled={pairForm.tags.length >= 10}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={pairForm.tags.length >= 10}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 rounded-lg text-white transition-all duration-200 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !pairForm.pfpFile || !pairForm.bannerFile || !pairForm.title}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin w-5 h-5" />
                    Uploading Pair...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Profile Pair
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
