import React, { useState, useEffect } from 'react';
import { Download, Heart, Eye, Calendar, Tag } from 'lucide-react';
import { useProfiles } from '../hooks/useProfiles';
import { useAuth } from '../context/authContext';
import { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface GalleryProps {
  searchQuery: string;
  selectedCategory: string;
  selectedType: string;
  viewMode: 'grid' | 'list';
}

export default function Gallery({ searchQuery, selectedCategory, selectedType, viewMode }: GalleryProps) {
  const { profiles, loading, downloadProfile, toggleFavorite } = useProfiles();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filter profiles based on search and filters
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = searchQuery === '' || 
      profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (profile.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || profile.category === selectedCategory;
    const matchesType = selectedType === 'all' || profile.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleDownload = async (profile: Profile) => {
    await downloadProfile(profile.id, user?.id);
    // Open image in new tab for download
    window.open(profile.image_url, '_blank');
  };

  const handleFavorite = async (profileId: string) => {
    if (!user) return;
    
    const result = await toggleFavorite(profileId, user.id);
    if (result !== null) {
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (result) {
          newFavorites.add(profileId);
        } else {
          newFavorites.delete(profileId);
        }
        return newFavorites;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      discord: 'text-indigo-400',
      twitter: 'text-blue-400',
      instagram: 'text-pink-400',
      general: 'text-purple-400'
    };
    return colors[category as keyof typeof colors] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-slate-700"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        : 'space-y-4'
      }>
        {filteredProfiles.map((profile) => (
          <div
            key={profile.id}
            className={`group bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105 ${
              viewMode === 'list' ? 'flex' : ''
            }`}
          >
            {/* Image */}
            <div className={`relative overflow-hidden ${
              viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-square'
            }`}>
              <img
                src={profile.image_url}
                alt={profile.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Overlay buttons */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex space-x-3">
                  <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(profile)}
                    className="p-2 bg-purple-600/80 backdrop-blur-sm rounded-full text-white hover:bg-purple-600 transition-all transform hover:scale-110"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {user && (
                    <button
                      onClick={() => handleFavorite(profile.id)}
                      className={`p-2 backdrop-blur-sm rounded-full transition-all ${
                        favorites.has(profile.id)
                          ? 'bg-red-600/80 text-white hover:bg-red-600'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${favorites.has(profile.id) ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* Category badge */}
              <div className="absolute top-3 left-3">
                <span className={`px-2 py-1 text-xs font-medium bg-black/50 backdrop-blur-sm rounded-full ${getCategoryColor(profile.category)}`}>
                  {profile.category}
                </span>
              </div>

              {/* Type badge */}
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 text-xs font-medium bg-black/50 backdrop-blur-sm rounded-full text-white">
                  {profile.type}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1">
              <h3 className="text-white font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                {profile.title}
              </h3>
              
              <div className="flex items-center space-x-4 text-sm text-slate-400 mb-3">
                <div className="flex items-center space-x-1">
                  <Download className="h-3 w-3" />
                  <span>{(profile.download_count || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(profile.created_at || '')}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {(profile.tags || []).slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-slate-700/50 text-slate-300 rounded-md"
                  >
                    <Tag className="h-2 w-2" />
                    <span>{tag}</span>
                  </span>
                ))}
                {(profile.tags || []).length > 3 && (
                  <span className="px-2 py-1 text-xs text-slate-400">
                    +{(profile.tags || []).length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProfiles.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="mb-4">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No profiles found.</h3>
          <p className="text-slate-400">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}