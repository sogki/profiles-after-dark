import { useState } from "react"
import { Upload, Loader } from "lucide-react"
import TagsInput from "./TagsInput"

interface EmojiComboUploadFormProps {
  form: {
    name: string
    combo_text: string
    description: string
    tags: string[]
  }
  onFormChange: (updates: Partial<typeof form>) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
}

export default function EmojiComboUploadForm({
  form,
  onFormChange,
  onSubmit,
  isSubmitting
}: EmojiComboUploadFormProps) {
  const handleAddTag = (tag: string) => {
    if (form.tags.length < 10 && !form.tags.includes(tag)) {
      onFormChange({ tags: [...form.tags, tag] })
    }
  }

  const handleRemoveTag = (tag: string) => {
    onFormChange({ tags: form.tags.filter(t => t !== tag) })
  }

  // Helper function to detect ASCII art
  const isLikelyAsciiArt = (text: string) => {
    const asciiChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/
    const hasAsciiChars = asciiChars.test(text)
    const hasMultipleLines = text.includes('\n')
    const hasSpaces = text.includes(' ')
    return hasAsciiChars || (hasMultipleLines && hasSpaces)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Form Fields */}
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="emojiName" className="block text-sm font-medium text-white mb-2">
            Name
          </label>
          <input
            id="emojiName"
            type="text"
            value={form.name}
            onChange={(e) => onFormChange({ name: e.target.value })}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Enter emoji combo name"
            required
          />
        </div>

        {/* Combo Text */}
        <div>
          <label htmlFor="emojiCombo" className="block text-sm font-medium text-white mb-2">
            Emoji Combo
          </label>
          <input
            id="emojiCombo"
            type="text"
            value={form.combo_text}
            onChange={(e) => onFormChange({ combo_text: e.target.value })}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Enter emoji combination (e.g., 😀🔥💯)"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="emojiDescription" className="block text-sm font-medium text-white mb-2">
            Description (Optional)
          </label>
          <textarea
            id="emojiDescription"
            value={form.description}
            onChange={(e) => onFormChange({ description: e.target.value })}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Enter description"
            rows={3}
          />
        </div>
      </div>

      {/* Preview */}
      {form.combo_text && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white">
            Preview
          </label>
          <div
            className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-200"
            style={{
              fontFamily: isLikelyAsciiArt(form.combo_text)
                ? "'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace"
                : "inherit",
              fontSize: isLikelyAsciiArt(form.combo_text)
                ? form.combo_text.length > 2000
                  ? "12px"
                  : form.combo_text.length > 1000
                    ? "14px"
                    : form.combo_text.length > 500
                      ? "16px"
                      : "18px"
                : form.combo_text.length > 100
                  ? "2rem"
                  : "3rem",
              whiteSpace: isLikelyAsciiArt(form.combo_text) ? "pre" : "normal",
              lineHeight: isLikelyAsciiArt(form.combo_text) ? "1" : "1.3",
              color: "white",
              letterSpacing: "0",
              fontWeight: "400",
              textAlign: isLikelyAsciiArt(form.combo_text) ? "left" : "center",
              display: isLikelyAsciiArt(form.combo_text) ? "block" : "flex",
              alignItems: isLikelyAsciiArt(form.combo_text) ? "flex-start" : "center",
              justifyContent: isLikelyAsciiArt(form.combo_text) ? "flex-start" : "center",
              minHeight: isLikelyAsciiArt(form.combo_text) ? "auto" : "120px",
            }}
          >
            {form.combo_text}
          </div>
        </div>
      )}

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
        disabled={isSubmitting || !form.name || !form.combo_text}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader className="animate-spin w-5 h-5" />
            Uploading Emoji Combo...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Upload Emoji Combo
          </>
        )}
      </button>
    </form>
  )
}
