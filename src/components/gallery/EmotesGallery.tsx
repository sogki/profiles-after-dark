import React, { useState, useEffect } from 'react';
// import { useProfiles } from '../../hooks/useProfiles';
// import { useAuth } from '../../context/authContext';
// import { Eye, Download, Heart } from 'lucide-react';
// import PreviewModal from '../modal/PreviewModal';

export default function EmotesGallery() {
  // const { profiles, downloadProfile, toggleFavorite } = useProfiles('emotes');
  // const { user } = useAuth();
  // const [selectedProfile, setSelectedProfile] = useState<any>(null);
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // useEffect(() => {
  //   // Optional: preload favorites if stored
  // }, [profiles]);

  // const handlePreview = (profile: any) => {
  //   setSelectedProfile(profile);
  //   setIsModalOpen(true);
  // };

  // const handleDownload = async (profile: any) => {
  //   await downloadProfile(profile.id, user?.id);
  //   const ext = profile.image_url.split('.').pop();
  //   const filename = `emote_${profile.title.replace(/\s+/g, '_').toLowerCase()}.${ext}`;
  //   const resp = await fetch(profile.image_url);
  //   const blob = await resp.blob();
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = filename;
  //   document.body.appendChild(a);
  //   a.click();
  //   a.remove();
  //   URL.revokeObjectURL(url);
  // };

  // const handleFavorite = async (profileId: string) => {
  //   if (!user) return;
  //   const result = await toggleFavorite(profileId, user.id);
  //   if (result !== null) {
  //     setFavorites(prev => {
  //       const updated = new Set(prev);
  //       result ? updated.add(profileId) : updated.delete(profileId);
  //       return updated;
  //     });
  //   }
  // };

  return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center">
      <h2 className="text-white text-4xl font-bold mb-4">Emotes Gallery</h2>
      <p className="text-lg text-slate-400">Coming soon</p>

      {/*
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className="group bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 rounded-xl overflow-hidden hover:scale-[1.03] transition-all"
          >
            <div className="relative aspect-square">
              <img
                src={profile.image_url}
                alt={profile.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                <button
                  onClick={() => handlePreview(profile)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full"
                  aria-label={`Preview ${profile.title}`}
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDownload(profile)}
                  className="p-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-full"
                  aria-label={`Download ${profile.title}`}
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleFavorite(profile.id)}
                  className={`p-2 ${
                    favorites.has(profile.id)
                      ? 'bg-red-600 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } rounded-full`}
                  aria-pressed={favorites.has(profile.id)}
                  aria-label={`${favorites.has(profile.id) ? 'Unfavorite' : 'Favorite'} ${profile.title}`}
                >
                  <Heart
                    className={`w-5 h-5 ${favorites.has(profile.id) ? 'fill-current' : ''}`}
                  />
                </button>
              </div>
            </div>
            <div
              className="p-3 text-white text-sm truncate"
              title={profile.title}
            >
              {profile.title}
            </div>
          </div>
        ))}
      </div>

      <PreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={selectedProfile}
      />
      */}
    </div>
  );
}
