import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, Tag, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface Profile {
  id: string;
  title: string;
  image_url: string;
  category: string;
  type: string;
  tags?: string[];
  created_at?: string;
  download_count?: number;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewProfile: Profile | null;
  handleDownload: (profile: Profile) => void;
}

export default function PreviewModal({
  isOpen,
  onClose,
  previewProfile,
  handleDownload,
}: PreviewModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="modal-fullpage-container" onClose={onClose}>
        <div className="modal-backdrop-light min-h-screen flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 modal-backdrop-light" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-3"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
          >
            <Dialog.Panel className="modal-popup-shell w-full max-w-5xl max-h-[90vh] overflow-y-auto text-left transition-all transform">
              {previewProfile ? (
                <>
                  <div className="sticky top-0 z-10 border-b border-slate-700/70 bg-slate-900/95 px-4 py-4 sm:px-6 flex items-center justify-between gap-4">
                    <Dialog.Title as="h3" className="text-2xl font-bold text-white truncate">
                      {previewProfile.title}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="btn-flat-secondary p-2"
                      aria-label="Close preview modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Image Section */}
                  <div className="relative bg-slate-800 px-4 py-4 sm:px-6">
                    <img
                      src={previewProfile.image_url}
                      alt={previewProfile.title}
                      className="w-full max-h-[58vh] object-contain rounded-xl border border-slate-700/70"
                    />
                  
                    {/* Content Section */}
                    <div className="pt-8">

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-6 mb-6 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-purple-400" />
                        <span className="text-purple-300 font-medium">{previewProfile.category}</span>
                        <span className="text-slate-600">•</span>
                        <span className="capitalize">{previewProfile.type}</span>
                      </div>
                      {previewProfile.created_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <span>{new Date(previewProfile.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      {previewProfile.download_count !== undefined && (
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-green-400" />
                          <span>{previewProfile.download_count} downloads</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {(previewProfile.tags || []).length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {previewProfile.tags.map((tag) => (
                            <motion.span
                              key={tag}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-block bg-purple-600/20 text-purple-300 px-3 py-1.5 rounded-lg text-sm border border-purple-600/30 hover:bg-purple-600/30 transition-colors"
                            >
                              #{tag}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-6 border-t border-slate-700">
                      <motion.button
                        onClick={() => handleDownload(previewProfile)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-flat-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                        aria-label={`Download ${previewProfile.title}`}
                      >
                        <Download className="h-5 w-5" />
                        Download
                      </motion.button>
                      <button
                        onClick={onClose}
                        className="btn-flat-secondary px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-slate-400">No profile selected.</p>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
