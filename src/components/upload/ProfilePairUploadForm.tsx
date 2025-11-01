import { useState } from "react"
import { Upload, Loader } from "lucide-react"
import FileUploadArea from "./FileUploadArea"
import TagsInput from "./TagsInput"
import { Camera } from "lucide-react"

interface ProfilePairUploadFormProps {
  form: {
    title: string
    category: string
    tags: string[]
    pfpFile: File | null
    bannerFile: File | null
  }
  onFormChange: (updates: Partial<typeof form>) => void
  onPfpFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBannerFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
}

export default function ProfilePairUploadForm({
  form,
  onFormChange,
  onPfpFileSelect,
  onBannerFileSelect,
  onSubmit,
  isSubmitting
}: ProfilePairUploadFormProps) {
  const handleAddTag = (tag: string) => {
    if (form.tags.length < 10 && !form.tags.includes(tag)) {
      onFormChange({ tags: [...form.tags, tag] })
    }
  }

  const handleRemoveTag = (tag: string) => {
    onFormChange({ tags: form.tags.filter(t => t !== tag) })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PFP Upload */}
        <FileUploadArea
          file={form.pfpFile}
          onFileSelect={onPfpFileSelect}
          inputId="pfpFileInput"
          label="Profile Picture"
          icon={Camera}
          maxSize={10 * 1024 * 1024}
        />

        {/* Banner Upload */}
        <FileUploadArea
          file={form.bannerFile}
          onFileSelect={onBannerFileSelect}
          inputId="bannerFileInput"
          label="Banner"
          icon={Camera}
          maxSize={10 * 1024 * 1024}
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
              value={form.title}
              onChange={(e) => onFormChange({ title: e.target.value })}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter profile pair title"
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
              value={form.category}
              onChange={(e) => onFormChange({ category: e.target.value })}
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
      <TagsInput
        tags={form.tags}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        maxTags={10}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !form.pfpFile || !form.bannerFile || !form.title}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader className="animate-spin w-5 h-5" />
            Uploading Profile Pair...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Upload Profile Pair
          </>
        )}
      </button>
    </form>
  )
}

