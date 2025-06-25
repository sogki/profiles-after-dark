// src/pages/UserProfile.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Footer from '../Footer';

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
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [loading, setLoading] = useState(true);

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

      console.log('Profile data:', profileData);
      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch uploads using user_id (auth ID)
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('profiles')
        .select('id, title, image_url')
        .eq('user_id', profileData.user_id)
        .order('created_at', { ascending: false });

      if (uploadsError) {
        console.error('Error fetching uploads:', uploadsError);
      } else {
        console.log('Uploads data:', uploadsData);
        setUploads(uploadsData || []);
      }

      setLoading(false);
    };

    fetchProfileAndUploads();
  }, [username]);

  if (loading) return <p>Loading profile...</p>;
  if (!profile) return <p>User not found</p>;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-4xl mx-auto px-4 py-8 flex-grow">
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

        <div className="pt-20 mb-8">
          <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
          <p className="mt-2 text-slate-300">{profile.bio || 'No bio provided.'}</p>
        </div>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">Uploads</h2>
          {uploads.length === 0 ? (
            <p className="text-slate-400 italic">No uploads yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="bg-slate-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                >
                  <img
                    src={upload.image_url}
                    alt={upload.title}
                    className="object-cover w-full h-48"
                  />
                  <div className="p-2">
                    <h3 className="text-white font-semibold">{upload.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
