import React, { useState, Fragment } from 'react';
// import { Eye, Tag, X } from 'lucide-react';
// import { useData } from '../../hooks/useProfiles'; 
// import { useAuth } from '../../context/authContext';
// import { Database } from '../../types/database';
// import { Dialog, Transition } from '@headlessui/react';

// type EmojiCombo = Database['public']['Tables']['emoji_combos']['Row'];

export default function EmojiCombosGallery() {
  // const { emojiCombos, emojiLoading } = useData();
  // const { user } = useAuth();
  // const [previewCombo, setPreviewCombo] = useState<EmojiCombo | null>(null);
  // const [isModalOpen, setIsModalOpen] = useState(false);

  // const openPreview = (combo: EmojiCombo) => {
  //   setPreviewCombo(combo);
  //   setIsModalOpen(true);
  // };

  // const closePreview = () => {
  //   setIsModalOpen(false);
  //   setPreviewCombo(null);
  // };

  // const PreviewModal = () => (
  //   <Transition appear show={isModalOpen} as={Fragment}>
  //     <Dialog
  //       as="div"
  //       className="fixed inset-0 z-50 overflow-y-auto"
  //       onClose={closePreview}
  //     >
  //       <div className="min-h-screen px-4 text-center bg-black bg-opacity-70">
  //         <Transition.Child
  //           as={Fragment}
  //           enter="ease-out duration-300"
  //           enterFrom="opacity-0 scale-95"
  //           enterTo="opacity-100 scale-100"
  //           leave="ease-in duration-200"
  //           leaveFrom="opacity-100 scale-100"
  //           leaveTo="opacity-0 scale-95"
  //         >
  //           <Dialog.Panel className="inline-block w-full max-w-2xl p-6 my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-xl rounded-lg relative">
  //             <button
  //               onClick={closePreview}
  //               className="absolute top-4 right-4 text-white hover:text-purple-400"
  //               aria-label="Close preview modal"
  //             >
  //               <X className="h-6 w-6" />
  //             </button>

  //             {previewCombo && (
  //               <>
  //                 <Dialog.Title
  //                   as="h3"
  //                   className="text-lg font-semibold text-white mb-4"
  //                 >
  //                   {previewCombo.name}
  //                 </Dialog.Title>

  //                 <pre className="whitespace-pre-wrap text-2xl leading-relaxed bg-slate-800 rounded-md p-4 mb-4 text-white">
  //                   {previewCombo.combo_text}
  //                 </pre>

  //                 {previewCombo.description && (
  //                   <p className="text-slate-300 mb-4">{previewCombo.description}</p>
  //                 )}

  //                 <div className="flex flex-wrap gap-2 mb-4">
  //                   {(previewCombo.tags || []).map(tag => (
  //                     <span
  //                       key={tag}
  //                       className="inline-block bg-purple-700 text-purple-200 px-3 py-1 rounded-full text-sm"
  //                     >
  //                       #{tag}
  //                     </span>
  //                   ))}
  //                 </div>

  //                 <p className="text-slate-400 text-sm">
  //                   Created: {new Date(previewCombo.created_at || '').toLocaleDateString()}
  //                 </p>
  //               </>
  //             )}
  //           </Dialog.Panel>
  //         </Transition.Child>
  //       </div>
  //     </Dialog>
  //   </Transition>
  // );

  // if (emojiLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center text-white">
  //       Loading emoji combos...
  //     </div>
  //   );
  // }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h1 className="text-4xl font-bold text-white mb-4">Emoji Combos</h1>
      <p className="text-lg text-slate-400">Coming soon</p>

      {/* 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {emojiCombos.map(combo => (
          <div
            key={combo.id}
            className="group bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
            onClick={() => openPreview(combo)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                openPreview(combo);
              }
            }}
          >
            <h3 className="text-white font-semibold mb-3 truncate">{combo.name}</h3>

            <pre className="whitespace-pre-wrap text-lg text-slate-300 mb-4 max-h-24 overflow-hidden">
              {combo.combo_text}
            </pre>

            <div className="flex flex-wrap gap-2">
              {(combo.tags || []).slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="inline-block bg-purple-700 text-purple-200 px-2 py-1 rounded-full text-xs truncate"
                  title={tag}
                >
                  #{tag}
                </span>
              ))}
              {(combo.tags || []).length > 3 && (
                <span className="px-2 py-1 text-xs text-slate-400">+{combo.tags.length - 3}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <PreviewModal />
      */}
    </div>
  );
}
