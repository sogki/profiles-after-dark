import type React from "react"
import { useState } from "react"
import { X, Upload, Tag, Loader, CheckCircle, AlertCircle, Camera, FileImage } from "lucide-react"
import { useProfiles } from "../hooks/useProfiles"
import { useAuth } from "../context/authContext"

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
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
  const [tagInput, setTagInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const { uploadProfile, uploadImage, uploadProfilePair } = useProfiles()
  const { user } = useAuth()

  if (!isOpen) return null

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  // File validation
  const validateFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]

    if (file.size > maxSize) {
      return "File is too large. Maximum size is 10MB."
    }

    if (!allowedTypes.includes(file.type)) {
      return "Invalid file type. Please upload JPG, PNG, GIF, or WebP images."
    }

    return null
  }

  // Single form handlers
  const handleSingleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
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
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      setPairForm({ ...pairForm, pfpFile: file })
      setError(null)
    }
  }

  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      setPairForm({ ...pairForm, bannerFile: file })
      setError(null)
    }
  }

  // Tag helpers
  const addTag = () => {
    if (uploadMode === "single") {
      if (tagInput.trim() && !singleForm.tags.includes(tagInput.trim()) && singleForm.tags.length < 10) {
        setSingleForm({
          ...singleForm,
          tags: [...singleForm.tags, tagInput.trim()],
        })
        setTagInput("")
      }
    } else {
      if (tagInput.trim() && !pairForm.tags.includes(tagInput.trim()) && pairForm.tags.length < 10) {
        setPairForm({
          ...pairForm,
          tags: [...pairForm.tags, tagInput.trim()],
        })
        setTagInput("")
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

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      const cleanFileName = sanitizeFilename(singleForm.file.name)
      const fileName = `${Date.now()}-${cleanFileName}`

      setUploadProgress(25)
      const { url, error: uploadError } = await uploadImage(singleForm.file, fileName)

      if (uploadError || !url) {
        throw new Error(uploadError || "Failed to upload image")
      }

      setUploadProgress(75)
      const { error: profileError } = await uploadProfile({
        title: singleForm.title,
        category: singleForm.category,
        type: singleForm.type,
        image_url: url,
        tags: singleForm.tags,
        user_id: user.id,
      })

      if (profileError) throw new Error(profileError)

      setUploadProgress(100)

      // Reset form and close
      setTimeout(() => {
        onClose()
        setSingleForm({
          title: "",
          category: "general",
          type: "profile",
          tags: [],
          file: null,
        })
        setUploadProgress(0)
      }, 500)
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

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Upload PFP
      const cleanPfpName = sanitizeFilename(pairForm.pfpFile.name)
      const pfpFileName = `${Date.now()}-pfp-${cleanPfpName}`

      setUploadProgress(20)
      const { url: pfpUrl, error: pfpUploadError } = await uploadImage(pairForm.pfpFile, pfpFileName)

      if (pfpUploadError || !pfpUrl) throw new Error(pfpUploadError || "Failed to upload profile picture")

      // Upload Banner
      const cleanBannerName = sanitizeFilename(pairForm.bannerFile.name)
      const bannerFileName = `${Date.now()}-banner-${cleanBannerName}`

      setUploadProgress(50)
      const { url: bannerUrl, error: bannerUploadError } = await uploadImage(pairForm.bannerFile, bannerFileName)

      if (bannerUploadError || !bannerUrl) throw new Error(bannerUploadError || "Failed to upload banner")

      // Create profile pair record
      setUploadProgress(80)
      const { error: pairError } = await uploadProfilePair({
        title: pairForm.title,
        category: pairForm.category,
        user_id: user.id,
        pfp_url: pfpUrl,
        banner_url: bannerUrl,
        tags: pairForm.tags,
      })

      if (pairError) throw new Error(pairError)

      setUploadProgress(100)

      // Reset form and close
      setTimeout(() => {
        onClose()
        setPairForm({
          title: "",
          category: "general",
          tags: [],
          pfpFile: null,
          bannerFile: null,
        })
        setUploadProgress(0)
      }, 500)
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
    icon?: React.ComponentType<any>
    compact?: boolean
  }) => (
    <div>
      <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-xl text-center transition-all duration-300 ${
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
            <CheckCircle className={`${compact ? "w-8 h-8" : "w-10 h-10"} text-green-500 mx-auto`} />
            <div className="text-center">
              <span className="text-sm font-medium text-green-400 block truncate max-w-[200px]">{file.name}</span>
              <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        ) : (
          <div className={`space-y-${compact ? "2" : "3"}`}>
            <Icon className={`${compact ? "w-8 h-8" : "w-10 h-10"} mx-auto text-slate-400`} />
            <div>
              <p className={`text-slate-300 font-medium ${compact ? "text-sm" : ""}`}>
                {compact ? "Drop image or " : "Drag and drop your image here"}
              </p>
              <p className="text-sm text-slate-400">
                {!compact && "or "}
                <label
                  htmlFor={inputId}
                  className="text-purple-400 cursor-pointer underline hover:text-purple-300 transition-colors"
                >
                  browse files
                </label>
              </p>
              {!compact && <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, GIF, WebP • Max 10MB</p>}
            </div>
            <input id={inputId} type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-4xl border border-slate-700/50 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="p-1.5 bg-purple-600/20 rounded-lg">
                <Upload className="h-5 w-5 text-purple-400" />
              </div>
              {uploadMode === "single" ? "Upload Single Asset" : "Upload Profile Pair"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {uploadMode === "single"
                ? "Upload a single profile picture or banner"
                : "Upload a matching profile picture and banner set"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switch */}
        <div className="flex p-3 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex bg-slate-700 rounded-lg p-1 w-full">
            <button
              onClick={() => {
                setError(null)
                setUploadMode("single")
                setTagInput("")
              }}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                uploadMode === "single"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-600"
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
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                uploadMode === "profilePair"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-600"
              }`}
            >
              Profile Pair
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isSubmitting && (
          <div className="px-4 pt-3">
            <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-slate-400 mt-1">Uploading... {uploadProgress}%</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="p-4">
          {uploadMode === "single" ? (
            <form onSubmit={handleSubmitSingle} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column - File Upload */}
                <div>
                  <FileUploadArea
                    file={singleForm.file}
                    onFileSelect={handleSingleFileSelect}
                    inputId="singleFileInput"
                    label="Upload Image"
                    icon={singleForm.type === "profile" ? Camera : FileImage}
                  />
                </div>

                {/* Right Column - Form Fields */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Title</label>
                    <input
                      type="text"
                      value={singleForm.title}
                      onChange={(e) => setSingleForm({ ...singleForm, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/50 p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter a descriptive title..."
                      required
                    />
                  </div>

                  {/* Category & Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Category</label>
                      <select
                        value={singleForm.category}
                        onChange={(e) =>
                          setSingleForm({
                            ...singleForm,
                            category: e.target.value as "discord" | "twitter" | "instagram" | "general",
                          })
                        }
                        className="w-full rounded-lg border border-slate-600 bg-slate-900/50 p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      >
                        <option value="general">General</option>
                        <option value="discord">Discord</option>
                        <option value="twitter">Twitter</option>
                        <option value="instagram">Instagram</option>
                      </select>
                    </div>

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
                        className="w-full rounded-lg border border-slate-600 bg-slate-900/50 p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      >
                        <option value="profile">Profile Picture</option>
                        <option value="banner">Banner</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags ({singleForm.tags.length}/10)
                    </label>
                    {singleForm.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {singleForm.tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 px-2 py-1 rounded-full text-xs"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:text-red-400 transition-colors"
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
                        placeholder="Add a tag..."
                        className="flex-grow rounded-lg border border-slate-600 bg-slate-900/50 p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        disabled={singleForm.tags.length >= 10}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        disabled={singleForm.tags.length >= 10}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 rounded-lg text-white font-medium transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !singleForm.file || !singleForm.title}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin h-5 w-5" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload Asset
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitPair} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* File Upload Areas */}
                <FileUploadArea
                  file={pairForm.pfpFile}
                  onFileSelect={handlePfpFileSelect}
                  inputId="pfpFileInput"
                  label="Profile Picture"
                  icon={Camera}
                  compact={true}
                />

                <FileUploadArea
                  file={pairForm.bannerFile}
                  onFileSelect={handleBannerFileSelect}
                  inputId="bannerFileInput"
                  label="Banner Image"
                  icon={FileImage}
                  compact={true}
                />

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Title</label>
                    <input
                      type="text"
                      value={pairForm.title}
                      onChange={(e) => setPairForm({ ...pairForm, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/50 p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Profile set title..."
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Category</label>
                    <select
                      value={pairForm.category}
                      onChange={(e) =>
                        setPairForm({
                          ...pairForm,
                          category: e.target.value as "discord" | "twitter" | "instagram" | "general",
                        })
                      }
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/50 p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags ({pairForm.tags.length}/10)
                </label>
                {pairForm.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-2">
                    {pairForm.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 px-2 py-1 rounded-full text-xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-400 transition-colors"
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
                    placeholder="Add a tag..."
                    className="flex-grow rounded-lg border border-slate-600 bg-slate-900/50 p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    disabled={pairForm.tags.length >= 10}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={pairForm.tags.length >= 10}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 rounded-lg text-white font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !pairForm.pfpFile || !pairForm.bannerFile || !pairForm.title}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin h-5 w-5" />
                    Uploading Profile Pair...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
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
