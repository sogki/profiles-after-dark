import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, Tag, Calendar, User } from 'lucide-react';
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
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center bg-black/80 backdrop-blur-sm">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl border border-slate-700">
              {previewProfile ? (
                <>
                  {/* Image Section */}
                  <div className="relative bg-slate-800">
                    <img
                      src={previewProfile.image_url}
                      alt={previewProfile.title}
                      className="w-full max-h-[60vh] object-contain"
                    />
                    <button
                      onClick={onClose}
                      className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white transition-all duration-200 backdrop-blur-sm z-10"
                      aria-label="Close preview modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-8">
                    <Dialog.Title
                      as="h3"
                      className="text-3xl font-bold text-white mb-6"
                    >
                      {previewProfile.title}
                    </Dialog.Title>

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
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-500/25"
                        aria-label={`Download ${previewProfile.title}`}
                      >
                        <Download className="h-5 w-5" />
                        Download
                      </motion.button>
                      <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors duration-200"
                      >
                        Close
                      </button>
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
