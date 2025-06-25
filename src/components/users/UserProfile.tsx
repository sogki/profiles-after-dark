// src/pages/UserProfile.tsx
import React, { useEffect, useState, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Footer from '../Footer';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

interface UserProfile {
  id: string; // row ID
  user_id: string; // Supabase Auth ID
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
}

interface UserUpload {
  id: string;
  title: string;
  image_url: string;
  tags?: string[];
  category?: string;
  type?: string;
  created_at?: string;
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [favorites, setFavorites] = useState<UserUpload[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [previewItem, setPreviewItem] = useState<UserUpload | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!username) return;

    const fetchProfileAndUploads = async () => {
      setLoading(true);

      // Fetch user profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, user_id, username, avatar_url, banner_url, bio')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch uploads using user_id (auth ID)
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('profiles')
        .select('id, title, image_url, tags, category, type, created_at')
        .eq('user_id', profileData.user_id)
        .order('created_at', { ascending: false });

      if (uploadsError) {
        console.error('Error fetching uploads:', uploadsError);
        setUploads([]);
      } else {
        setUploads(uploadsData || []);
      }

      // Fetch favorites for this user (assuming you have a favorites table)
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('profiles(id, title, image_url, tags, category, type, created_at)')
        .eq('user_id', profileData.user_id);

      if (favoritesError) {
        console.error('Error fetching favorites:', favoritesError);
        setFavorites([]);
      } else {
        // Flatten favorites data
        const favs = favoritesData?.map((fav: any) => fav.profiles) || [];
        setFavorites(favs);
      }

      setLoading(false);
    };

    fetchProfileAndUploads();
  }, [username]);

  const openPreview = (item: UserUpload) => {
    setPreviewItem(item);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewItem(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) return <p>Loading profile...</p>;
  if (!profile) return <p>User not found</p>;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-4xl mx-auto px-4 py-8 flex-grow">
        {/* Banner & Avatar */}
        <div className="relative mb-5 rounded-lg w-[80vw] max-w-full mx-auto">
          {profile.banner_url ? (
            <img
              src={profile.banner_url}
              alt={`${profile.username}'s banner`}
              className="object-cover w-full h-48 rounded-lg"
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-slate-700 text-slate-400 italic rounded-lg">
              No banner available
            </div>
          )}
          <img
            src={profile.avatar_url || '/default-avatar.png'}
            alt={`${profile.username}'s avatar`}
            className="w-24 h-24 rounded-full border-4 border-purple-600 absolute -bottom-14 left-4 object-cover bg-slate-800"
          />
        </div>

        {/* Username & Bio */}
        <div className="pt-20 mb-8">
          <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
          <p className="mt-2 text-slate-300">{profile.bio || 'No bio provided.'}</p>
        </div>

        {/* Uploads and Favorites side by side */}
        <div className="flex gap-6">
          {/* Uploads - more to the left */}
          <section className="flex-1 max-w-[48%]">
            <h2 className="text-2xl font-semibold mb-4 text-white">Uploads</h2>
            {uploads.length === 0 ? (
              <p className="text-slate-400 italic">No uploads yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {uploads.map((upload) => (
                  <div
                    key={upload.id}
                    onClick={() => openPreview(upload)}
                    className="cursor-pointer bg-slate-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={upload.image_url}
                      alt={upload.title}
                      className="object-cover w-full h-36"
                    />
                    <div className="p-2">
                      <h3 className="text-white font-semibold">{upload.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Separator line */}
          <div className="w-px bg-slate-600 my-2 ml-6"></div>

          {/* Favorites - pushed more to the right */}
          <section className="flex-1 max-w-[35%] ml-auto">
            <h2 className="text-2xl font-semibold mb-4 text-white">Favorites</h2>
            {favorites.length === 0 ? (
              <p className="text-slate-400 italic">No favorites yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => openPreview(fav)}
                    className="cursor-pointer bg-slate-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={fav.image_url}
                      alt={fav.title}
                      className="object-cover w-full h-36"
                    />
                    <div className="p-2">
                      <h3 className="text-white font-semibold">{fav.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Footer />

      {/* Preview Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={closePreview}>
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
                  onClick={closePreview}
                  className="absolute top-4 right-4 text-white hover:text-purple-400"
                  aria-label="Close preview modal"
                >
                  <X className="h-6 w-6" />
                </button>

                {previewItem && (
                  <>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-white mb-4">
                      {previewItem.title}
                    </Dialog.Title>

                    <img
                      src={previewItem.image_url}
                      alt={previewItem.title}
                      className="w-full max-h-[70vh] object-contain rounded-md mb-4"
                    />

                    <p className="text-slate-400 mb-2">
                      {previewItem.category || 'Unknown category'} / {previewItem.type || 'Unknown type'}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {(previewItem.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block bg-purple-700 text-purple-200 px-3 py-1 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        // Download logic
                        const link = document.createElement('a');
                        link.href = previewItem.image_url;
                        const extension = previewItem.image_url.split('.').pop()?.split(/[#?]/)[0] || 'png';
                        const filename = `${previewItem.title.replace(/\s+/g, '_').toLowerCase()}.${extension}`;
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition"
                    >
                      Download
                    </button>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
