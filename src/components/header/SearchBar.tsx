import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { supabase } from "../../lib/supabase"

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchRef: React.RefObject<HTMLDivElement>
}

export default function SearchBar({ searchQuery, onSearchChange, searchRef }: SearchBarProps) {
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)

  useEffect(() => {
    if (searchQuery.length > 1) {
      fetchSearchSuggestions(searchQuery)
    } else {
      setSearchSuggestions([])
      setShowSearchSuggestions(false)
    }
  }, [searchQuery])

  const fetchSearchSuggestions = async (query: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("title").ilike("title", `%${query}%`).limit(5)

      if (error) throw error
      const suggestions = data?.map((item) => item.title) || []
      setSearchSuggestions(suggestions)
      setShowSearchSuggestions(suggestions.length > 0)
    } catch (error) {
      console.error("Failed to fetch search suggestions:", error)
    }
  }

  const handleSearchSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion)
    setShowSearchSuggestions(false)
  }

  return (
    <div className="relative" ref={searchRef}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        placeholder="Search profiles, users, tags..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => searchQuery.length > 1 && setShowSearchSuggestions(true)}
        className="pl-10 pr-4 py-2 w-80 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
      />
      {showSearchSuggestions && searchSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
          {searchSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSearchSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 text-white hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <Search className="inline h-3 w-3 mr-2 text-slate-400" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}