import { Dispatch, SetStateAction } from "react"

interface ProfilePair {
  id: string
  user_id?: string
  title: string
  category?: string
  tags?: string[]
  pfp_url: string
  banner_url: string
  download_count?: number
  created_at?: string
  updated_at?: string
  color?: string
  type: "pair"
}

interface Profile {
  id: string
  user_id: string
  title: string
  category: string
  type: string
  image_url: string
  download_count: number
  tags: string[]
  created_at: string
  updated_at: string
  text_data: string
}

type GalleryItem = ProfilePair | Profile

interface PaginationProps {
  filteredProfiles: GalleryItem[]
  page: number
  setPage: Dispatch<SetStateAction<number>>
  itemsPerPage: number
}

export default function Pagination({ filteredProfiles, page, setPage, itemsPerPage }: PaginationProps) {
  return (
    <>
      {filteredProfiles.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            aria-label="Previous page"
            type="button"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, Math.ceil(filteredProfiles.length / itemsPerPage)) }).map((_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-12 h-12 rounded-lg font-medium transition-colors ${
                    page === pageNum ? "bg-purple-600 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            {Math.ceil(filteredProfiles.length / itemsPerPage) > 5 && (
              <>
                <span className="text-gray-400">...</span>
                <button
                  onClick={() => setPage(Math.ceil(filteredProfiles.length / itemsPerPage))}
                  className={`w-12 h-12 rounded-lg font-medium transition-colors ${
                    page === Math.ceil(filteredProfiles.length / itemsPerPage)
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  {Math.ceil(filteredProfiles.length / itemsPerPage)}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(filteredProfiles.length / itemsPerPage)))}
            disabled={page === Math.ceil(filteredProfiles.length / itemsPerPage)}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            aria-label="Next page"
            type="button"
          >
            Next
          </button>
        </div>
      )}
    </>
  )
}