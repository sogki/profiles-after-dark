import { useState } from "react"
import { Plus } from "lucide-react"

interface TagsInputProps {
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  maxTags?: number
  placeholder?: string
}

export default function TagsInput({
  tags,
  onAddTag,
  onRemoveTag,
  maxTags = 10,
  placeholder = "Add a tag and press Enter"
}: TagsInputProps) {
  const [tagInput, setTagInput] = useState("")

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onAddTag(trimmedTag)
      setTagInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Tags ({tags.length}/{maxTags})
      </label>
      
      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
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
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-slate-600 bg-slate-800 p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          disabled={tags.length >= maxTags}
        />
        <button
          type="button"
          onClick={handleAddTag}
          disabled={tags.length >= maxTags || !tagInput.trim()}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 rounded-lg text-white transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
    </div>
  )
}

