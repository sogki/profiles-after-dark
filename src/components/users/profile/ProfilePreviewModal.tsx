import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Tag, X } from "lucide-react";

interface BaseItem {
  id: string;
  title?: string | null;
  category?: string | null;
  tags?: string[];
  created_at?: string;
}

interface SingleImageItem extends BaseItem {
  image_url: string;
}

interface PairItem extends BaseItem {
  pfp_url: string | null;
  banner_url: string | null;
}

type PreviewItem = SingleImageItem | PairItem | null;

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewItem: PreviewItem;
  formatDate: (dateString: string) => string;
}

export default function ProfilePreviewModal({
  isOpen,
  onClose,
  previewItem,
  formatDate,
}: ProfilePreviewModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={onClose}>
        <div className="min-h-screen px-4 text-center modal-backdrop-light flex items-center justify-center py-8">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="inline-block w-full max-w-5xl my-0 max-h-[90vh] overflow-y-auto text-left align-middle transition-all transform modal-popup-shell">
              <div className="relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors z-10"
                >
                  <X className="w-6 h-6" />
                </button>

                {previewItem && "image_url" in previewItem ? (
                  <>
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={previewItem.image_url || "/placeholder.svg"}
                        alt={previewItem.title || "Preview image"}
                        className="w-full h-full object-contain bg-slate-800"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{previewItem.title || "Untitled"}</h3>
                      <p className="text-gray-300 mb-4">{previewItem.category || "No category"}</p>

                      {previewItem.tags && previewItem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {previewItem.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 bg-purple-900/30 text-purple-300 px-3 py-1 rounded-full text-sm"
                            >
                              <Tag className="h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {previewItem.created_at && (
                        <p className="text-sm text-gray-400">Created on {formatDate(previewItem.created_at)}</p>
                      )}
                    </div>
                  </>
                ) : (
                  previewItem &&
                  "pfp_url" in previewItem && (
                    <>
                      <div className="relative">
                        {previewItem.banner_url && (
                          <img
                            src={previewItem.banner_url || "/placeholder.svg"}
                            alt={`${previewItem.title} banner`}
                            className="w-full h-64 object-cover brightness-75"
                            loading="lazy"
                          />
                        )}
                        {previewItem.pfp_url && (
                          <img
                            src={previewItem.pfp_url || "/placeholder.svg"}
                            alt={`${previewItem.title} profile`}
                            className="w-32 h-32 rounded-full border-4 border-purple-500 absolute top-48 left-1/2 transform -translate-x-1/2 bg-slate-900"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="pt-20 pb-8 px-6 text-center">
                        <Dialog.Title as="h3" className="text-3xl font-bold leading-12 text-white mb-5">
                          {previewItem.title || "Untitled"}
                        </Dialog.Title>
                        <div className="flex flex-wrap justify-center gap-2 mb-6 max-h-20 overflow-auto px-2">
                          {(previewItem.tags || []).map((tag) => (
                            <span
                              key={tag}
                              className="bg-purple-700/30 text-purple-200 text-sm px-3 py-1 rounded-full select-none whitespace-nowrap border border-purple-600/30"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

