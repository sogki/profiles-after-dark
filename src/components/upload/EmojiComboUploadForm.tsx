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

  // Helper function to detect ASCII art (same logic as gallery)
  const isLikelyAsciiArt = (text: string) => {
    // Check for newlines (multi-line content)
    if (text.includes("\n")) return true

    // Check for ASCII art characters
    if (/[│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬▀▄█▌▐░▒▓■□▪▫◆◇○●◦‣⁃]/.test(text)) return true

    // Check for repeated characters (common in ASCII art)
    if (/(.)\1{4,}/.test(text)) return true

    // Check for long text that might be ASCII art
    if (
      text.length > 50 &&
      !/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(text)
    )
      return true

    return false
  }

  // Get card styles based on content (same logic as gallery)
  const getCardStyles = (text: string) => {
    const isAscii = isLikelyAsciiArt(text)
    const contentLength = text.length

    if (isAscii) {
      return {
        fontSize:
          contentLength > 2000
            ? "8px"
            : contentLength > 1000
              ? "10px"
              : contentLength > 500
                ? "12px"
                : contentLength > 200
                  ? "14px"
                  : "16px",
        lineHeight: "1.0",
        padding: "12px",
      }
    } else {
      return {
        minHeight: contentLength > 50 ? "80px" : "60px",
        fontSize: contentLength > 100 ? "2rem" : contentLength > 50 ? "2.5rem" : "3rem",
        lineHeight: "1.1",
        padding: "16px",
      }
    }
  }

  const cardStyles = form.combo_text ? getCardStyles(form.combo_text) : null
  const isAscii = form.combo_text ? isLikelyAsciiArt(form.combo_text) : false

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

      {/* Preview - Shows how it will look on the site */}
      {form.combo_text && cardStyles && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white">
            Preview (How it will appear on the site)
          </label>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600 shadow-lg">
            {/* Content Preview Area - matches gallery style */}
            <div
              className="relative cursor-default bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-200"
              style={{ padding: cardStyles.padding }}
            >
              <div
                className={`w-full flex ${isAscii ? "items-start justify-start" : "items-center justify-center"}`}
                style={{
                  fontFamily: isAscii ? "'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace" : "inherit",
                  fontSize: cardStyles.fontSize,
                  whiteSpace: isAscii ? "pre" : "normal",
                  lineHeight: cardStyles.lineHeight,
                  color: "white",
                  letterSpacing: isAscii ? "-0.5px" : "0",
                  fontWeight: isAscii ? "400" : "500",
                  textAlign: isAscii ? "left" : "center",
                  wordBreak: "normal",
                  overflowWrap: "normal",
                  width: "100%",
                  minHeight: isAscii ? "auto" : cardStyles.minHeight,
                }}
              >
                <div
                  className={`${isAscii ? "w-full" : ""}`}
                  style={{
                    maxWidth: "100%",
                    whiteSpace: isAscii ? "pre" : "normal",
                  }}
                >
                  {form.combo_text}
                </div>
              </div>
            </div>

            {/* Info Section - matches gallery style */}
            <div className="p-3 sm:p-4 bg-slate-900/30">
              <h3 className="font-semibold text-white mb-2 truncate text-sm sm:text-base">
                {form.name || "Untitled"}
              </h3>
              
              {form.description && (
                <p className="text-xs sm:text-sm text-gray-400 mb-2 line-clamp-2">
                  {form.description}
                </p>
              )}

              {form.tags && form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {form.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs bg-purple-500/20 text-purple-300 px-1.5 sm:px-2 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                  {form.tags.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{form.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
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
