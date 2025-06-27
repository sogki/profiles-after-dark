// src/pages/UsersList.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Footer from '../Footer'; 

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
}

export default function UsersList() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, avatar_url, banner_url, bio')
        .order('username', { ascending: true });

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900"> {/* make full height & bg like UserProfile */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6 text-white">User Profiles</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map((user) => (
            <Link
              key={user.id}
              to={`/user/${user.username}`}
              className="block bg-slate-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="relative h-32 bg-slate-700">
                {user.banner_url ? (
                  <img
                    src={user.banner_url}
                    alt={`${user.username}'s banner`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 italic">
                    No banner
                  </div>
                )}
              </div>
              <div className="p-4 flex items-center space-x-4">
                <img
                  src={user.avatar_url || '/default-avatar.png'}
                  alt={`${user.username}'s avatar`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-600"
                />
                <div>
                  <h2 className="text-lg font-semibold text-white">{user.username}</h2>
                  <p className="text-sm text-slate-400 truncate max-w-xs">{user.bio || 'No bio available'}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer /> {/* <-- Add Footer here */}
    </div>
  );
}
