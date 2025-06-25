import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download } from 'lucide-react';

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
        <div className="min-h-screen px-4 text-center bg-black bg-opacity-70">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="inline-block w-full max-w-3xl p-6 my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-xl rounded-lg relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-purple-400"
                aria-label="Close preview modal"
              >
                <X className="h-6 w-6" />
              </button>

              {previewProfile ? (
                <>
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold text-white mb-4"
                  >
                    {previewProfile.title}
                  </Dialog.Title>

                  <img
                    src={previewProfile.image_url}
                    alt={previewProfile.title}
                    className="w-full max-h-[70vh] object-contain rounded-md mb-4"
                  />

                  <p className="text-slate-400 mb-2">
                    {previewProfile.category} / {previewProfile.type}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(previewProfile.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-purple-700 text-purple-200 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(previewProfile)}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                    aria-label={`Download ${previewProfile.title}`}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download
                  </button>
                </>
              ) : (
                <p className="text-white">No profile selected.</p>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
