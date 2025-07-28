import { Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Download, Clock } from "lucide-react"

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

interface PreviewModalProps {
  isOpen: boolean
  closePreview: () => void
  previewProfile: ProfilePair | null
  handleDownloadBoth: (profile: ProfilePair) => Promise<void>
}

export default function PreviewModal({ isOpen, closePreview, previewProfile, handleDownloadBoth }: PreviewModalProps) {
  if (!previewProfile) return null

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={closePreview}>
        <div className="min-h-screen px-4 text-center bg-black bg-opacity-80 backdrop-blur-sm">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="inline-block w-full max-w-4xl my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl border border-slate-700">
              <div className="relative">
                {previewProfile.banner_url && (
                  <img
                    src={previewProfile.banner_url || "/placeholder.svg"}
                    alt={`${previewProfile.title} banner`}
                    className="w-full h-64 object-cover brightness-75"
                    loading="lazy"
                  />
                )}
                {previewProfile.pfp_url && (
                  <img
                    src={previewProfile.pfp_url || "/placeholder.svg"}
                    alt={`${previewProfile.title} profile`}
                    className="w-32 h-32 rounded-full border-4 border-purple-500 absolute top-48 left-1/2 transform -translate-x-1/2 bg-slate-900"
                    loading="lazy"
                  />
                )}

                <button
                  onClick={closePreview}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="pt-20 pb-8 px-8">
                <Dialog.Title as="h3" className="text-3xl font-bold leading-12 text-white mb-5">
                  {previewProfile.title}
                </Dialog.Title>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                  <div className="flex items-center gap-1">
                    <span className="text-purple-300 font-medium">{previewProfile.category || "General"}</span>
                  </div>
                  {previewProfile.download_count !== undefined && (
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>{previewProfile.download_count} downloads</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Updated {new Date(previewProfile.updated_at || "").toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mb-6 max-h-20 overflow-auto px-2">
                  {(previewProfile.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="bg-purple-700/30 text-purple-200 text-sm px-3 py-1 rounded-full select-none whitespace-nowrap border border-purple-600/30"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex justify-center gap-6">
                  <button
                    onClick={() => handleDownloadBoth(previewProfile)}
                    className="inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                    type="button"
                  >
                    <Download className="h-5 w-5" />
                    Download Profile Combo
                  </button>

                  <button
                    type="button"
                    className="inline-flex justify-center px-8 py-3 text-sm font-semibold text-purple-400 bg-transparent border border-purple-600 rounded-lg hover:bg-purple-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                    onClick={closePreview}
                  >
                    Close
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}