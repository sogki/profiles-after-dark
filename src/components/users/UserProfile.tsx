import { Dialog, Menu, Transition } from "@headlessui/react";
import {
  Calendar,
  Flag,
  Grid3X3,
  Heart,
  MoreHorizontal,
  Settings,
  Tag,
  User,
  X,
  UserPlus,
  UserMinus,
  Activity,
  Download,
  Share2,
  ZoomIn,
  RotateCcw,
} from "lucide-react";
import { Fragment, useState, useEffect } from "react";
import { BsFillEmojiHeartEyesFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import EnhancedReportModal from "../moderation/modals/EnhancedReportModal";

import useRetrieveProfileFavorites from "@/hooks/users/profile-info/use-retrieve-profile-favorites";
import useRetrieveProfilePairs from "@/hooks/users/profile-info/use-retrieve-profile-pairs";
import useRetrieveProfileUploads from "@/hooks/users/profile-info/use-retrieve-profile-uploads";
import useRetrieveUserProfile from "@/hooks/users/profile-info/use-retrieve-user-profile";
import Footer from "../Footer";

interface Badge {
  name: string;
  image_url: string | null;
  description?: string;
}

interface UserBadge {
  badges: Badge;
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  user_badges?: UserBadge[];
  created_at?: string | null;
}

interface UserUpload {
  id: string;
  title: string;
  image_url: string;
  tags?: string[] | null;
  category?: string;
  type?: string;
  created_at?: string | null;
}

interface ProfilePair {
  id: string;
  user_id: string;
  pfp_url: string | null;
  banner_url: string | null;
  title: string | null;
  category: string | null;
  tags?: string[] | null;
  created_at?: string | null;
}

interface UserEmojiUpload {
  id: string;
  user_id: string;
  name: string;
  combo_text: string | null;
  description: string | null;
  tags?: string[];
  created_at?: string | null;
}

export default function UserProfile() {
  const {
    data: profile,
    isLoading: profileLoading,
    currentUser: { id: currentUserProfileId },
  } = useRetrieveUserProfile();

  // Check if this is the current user's own profile
  const isOwnProfile = profile?.user_id === currentUserProfileId;

  const { data: uploads, isLoading: uploadsLoading } =
    useRetrieveProfileUploads();

  const { data: profilePairs, isLoading: profilePairsLoading } =
    useRetrieveProfilePairs();

  const { data: favorites, isLoading: favoritesLoading } =
    useRetrieveProfileFavorites();

  const loading =
    profileLoading || uploadsLoading || profilePairsLoading || favoritesLoading;

  const [emojicombos] = useState<UserEmojiUpload[]>([]);
  const [previewItem, setPreviewItem] = useState<
    UserUpload | ProfilePair | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "uploads" | "pairs" | "favorites" | "emojicombos"
  >("uploads");
  const [showAllBadges, setShowAllBadges] = useState(false);
  
  // Social features
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [recentActivity] = useState<any[]>([]);
  
  // Image handling
  const [imageZoom, setImageZoom] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);

  // Load follow status and user stats
  useEffect(() => {
    if (!profile || !currentUserProfileId || isOwnProfile) return;

    const loadFollowStatus = async () => {
      try {
        // Check if current user is following this profile
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserProfileId)
          .eq('following_id', profile.user_id)
          .single();

        if (!followError && followData) {
          setIsFollowing(true);
        }
      } catch (error) {
        console.error('Error loading follow status:', error);
      }
    };

    const loadUserStats = async () => {
      try {
        // Load user stats
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('followers_count, following_count')
          .eq('user_id', profile.user_id)
          .single();

        if (!statsError && statsData) {
          setFollowersCount(statsData.followers_count || 0);
          setFollowingCount(statsData.following_count || 0);
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    };

    loadFollowStatus();
    loadUserStats();
  }, [profile, currentUserProfileId, isOwnProfile]);

  const openPreview = (item: UserUpload | ProfilePair) => {
    setPreviewItem(item);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewItem(null);
  };

  const openReportModal = () => {
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleFollow = async () => {
    if (!profile || !currentUserProfileId) return;
    
    // Prevent users from following themselves
    if (isOwnProfile) return;
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserProfileId)
          .eq('following_id', profile.user_id);
        
        if (!error) {
          setIsFollowing(false);
          setFollowersCount(prev => Math.max(0, prev - 1));
        } else {
          console.error('Error unfollowing:', error);
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserProfileId,
            following_id: profile.user_id
          });
        
        if (!error) {
          setIsFollowing(true);
          setFollowersCount(prev => prev + 1);
        } else {
          console.error('Error following:', error);
        }
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.username}'s Profile`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownload = async (item: UserUpload | ProfilePair) => {
    try {
      const url = 'image_url' in item ? item.image_url : item.pfp_url;
      if (!url) return;
      
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${item.title || 'download'}.${url.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">User not found</h2>
          <p className="text-gray-400">
            The profile you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="relative mb-8">
            {/* Banner */}
            <div className="relative h-64 md:h-80 rounded-2xl overflow-y-visible bg-gradient-to-r from-purple-600 to-blue-600">
              {profile.banner_url ? (
                <img
                  src={profile.banner_url || "/placeholder.svg"}
                  alt={`${profile.username}'s banner`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <div className="text-white/20 text-4xl sm:text-6xl">
                    <User />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20"></div>

              {/* Avatar */}
              <img
                src={profile.avatar_url || "/default-avatar.png"}
                alt={`${profile.username}'s avatar`}
                className="w-40 h-40 rounded-full z-10 border-4 border-white absolute top-60 left-40 transform -translate-x-1/2 border-solid bg-slate-900 shadow-xl object-cover"
              />
            </div>

            {/* Profile Info */}
            <div className="relative px-4 sm:px-6 pb-6">
              {/* Action Buttons - Responsive */}
              <div className="absolute -top-2 sm:-top-4 right-4 sm:right-6 flex gap-2">
                {isOwnProfile ? (
                  <Link
                    to="/profile-settings"
                    className="inline-flex items-center gap-2 bg-white text-gray-900 px-3 sm:px-4 py-2 sm:py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg text-sm sm:text-base"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit Profile</span>
                    <span className="sm:hidden">Edit</span>
                  </Link>
                ) : (
                  <>
                    {!isOwnProfile && (
                      <button
                        onClick={handleFollow}
                        className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-full font-semibold transition-colors shadow-lg text-sm sm:text-base ${
                          isFollowing
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-purple-500 text-white hover:bg-purple-600"
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4" />
                            <span className="hidden sm:inline">Unfollow</span>
                            <span className="sm:hidden">-</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            <span className="hidden sm:inline">Follow</span>
                            <span className="sm:hidden">+</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-3 sm:px-4 py-2 sm:py-3 rounded-full hover:bg-white/20 transition-colors shadow-lg"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <Menu as="div" className="relative">
                      <Menu.Button className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors">
                        <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={openReportModal}
                                className={`${
                                  active
                                    ? "bg-red-50 text-red-600"
                                    : "text-gray-700"
                                } flex items-center gap-3 w-full px-4 py-3 text-left text-sm rounded-xl`}
                              >
                                <Flag className="h-4 w-4" />
                                Report User
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </>
                )}
              </div>

              {/* Profile Details - Reddit-style layout */}
              <div className="pt-24">
                {/* Profile Info - Mixed Layout */}
                <div className="mb-8">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-8 max-w-6xl mx-auto">
                    {/* Left Side - Username and Bio */}
                    <div className="lg:w-1/3">
                      {/* Username and Handle */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-3 mb-1">
                          <h1 className="text-2xl md:text-3xl font-bold text-white">
                            {profile.username}
                          </h1>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Joined{" "}
                              {profile.created_at
                                ? formatDate(profile.created_at)
                                : "Unknown"}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm">
                          @{profile.username}
                        </p>
                      </div>

                      {/* Bio Section */}
                      {profile.bio && (
                        <div className="mb-4">
                          <p className="text-gray-300 text-base leading-relaxed">
                            {profile.bio}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Side - Stats (Centered) */}
                    <div className="lg:w-2/3 text-center lg:text-left">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{followersCount}</div>
                          <div className="text-xs text-gray-400 uppercase tracking-wide">Followers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{followingCount}</div>
                          <div className="text-xs text-gray-400 uppercase tracking-wide">Following</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{uploads?.length || 0}</div>
                          <div className="text-xs text-gray-400 uppercase tracking-wide">Uploads</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{favorites?.length || 0}</div>
                          <div className="text-xs text-gray-400 uppercase tracking-wide">Favorites</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Layout - Reddit Style */}
                <div className="flex gap-8 max-w-7xl mx-auto">
                  {/* Main Content - Center */}
                  <div className="flex-1 min-w-0">
                    {/* Content Tabs */}
                    <div className="mb-8">
                      <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-xl p-1">
                        {[
                          {
                            id: "uploads",
                            label: "Uploads",
                            count: uploads?.length || 0,
                            icon: Grid3X3,
                          },
                          {
                            id: "pairs",
                            label: "Profile Pairs",
                            count: profilePairs?.length || 0,
                            icon: User,
                          },
                          {
                            id: "favorites",
                            label: "Favorites",
                            count: favorites?.length ?? 0,
                            icon: Heart,
                          },
                          {
                            id: "emojicombos",
                            label: "Emoji Combos",
                            count: emojicombos.length,
                            icon: BsFillEmojiHeartEyesFill,
                          },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() =>
                              setActiveTab(
                                tab.id as
                                  | "uploads"
                                  | "pairs"
                                  | "favorites"
                                  | "emojicombos"
                              )
                            }
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                              activeTab === tab.id
                                ? "bg-white text-gray-900 shadow-lg"
                                : "text-white/70 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <tab.icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                            <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                              {tab.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Content Rendering */}
                    <div>
                      {/* Uploads Tab */}
                      {activeTab === "uploads" && (
                        <div>
                          {uploads?.length === 0 ? (
                            <div className="text-center py-16">
                              <Grid3X3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-white mb-2">
                                No uploads yet
                              </h3>
                              <p className="text-gray-400">
                                {isOwnProfile
                                  ? "You haven't uploaded any content yet."
                                  : "This user hasn't uploaded any content yet."}
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {uploads?.map((upload) => (
                                <div
                                  key={upload.id}
                                  className="group cursor-pointer"
                                  onClick={() => openPreview(upload)}
                                >
                                  <div className="aspect-square overflow-hidden rounded-xl bg-slate-800">
                                    <img
                                      src={upload.image_url || "/placeholder.svg"}
                                      alt={upload.title || "Upload"}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  <div className="mt-3">
                                    <h3 className="font-semibold text-white truncate">
                                      {upload.title || "Untitled"}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                      {upload.category || "No category"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Profile Pairs Tab */}
                      {activeTab === "pairs" && (
                        <div>
                          {profilePairs?.length === 0 ? (
                            <div className="text-center py-16">
                              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-white mb-2">
                                No profile pairs yet
                              </h3>
                              <p className="text-gray-400">
                                {isOwnProfile
                                  ? "You haven't created any profile pairs yet."
                                  : "This user hasn't created any profile pairs yet."}
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {profilePairs?.map((pair) => (
                                <div
                                  key={pair.id}
                                  className="group cursor-pointer"
                                  onClick={() => openPreview(pair)}
                                >
                                  <div className="relative aspect-square overflow-visible bg-slate-800">
                                    <div className="w-full h-full overflow-hidden rounded-xl">
                                      <img
                                        src={pair.banner_url || "/placeholder.svg"}
                                        alt={pair.title || "Profile Pair"}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    </div>
                                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                                      <img
                                        src={pair.pfp_url || "/default-avatar.png"}
                                        alt="Profile Picture"
                                        className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-8">
                                    <h3 className="font-semibold text-white truncate">
                                      {pair.title || "Untitled"}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                      Profile Pair
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Favorites Tab */}
                      {activeTab === "favorites" && (
                        <div>
                          {favorites?.length === 0 ? (
                            <div className="text-center py-16">
                              <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-white mb-2">
                                No favorites yet
                              </h3>
                              <p className="text-gray-400">
                                {isOwnProfile
                                  ? "You haven't favorited any content yet."
                                  : "This user hasn't favorited any content yet."}
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {favorites?.map((favorite) => (
                                <div
                                  key={favorite.id}
                                  className="group cursor-pointer"
                                  onClick={() => favorite.upload && openPreview(favorite.upload)}
                                >
                                  <div className="aspect-square overflow-hidden rounded-xl bg-slate-800">
                                    <img
                                      src={favorite.upload?.image_url || "/placeholder.svg"}
                                      alt={favorite.upload?.title || "Favorite"}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  <div className="mt-3">
                                    <h3 className="font-semibold text-white truncate">
                                      {favorite.upload?.title || "Favorite"}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                      {favorite.upload?.category || favorite.upload?.type || "Favorite"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Emoji Combos Tab */}
                      {activeTab === "emojicombos" && (
                        <div>
                          {favorites?.length === 0 ? (
                            <div className="text-center py-16">
                              <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-white mb-2">
                                Emoji Combos will be displayed here soon.
                              </h3>
                              <p className="text-gray-400">
                                {isOwnProfile
                                  ? "You haven't uploaded Emoji Combos yet."
                                  : "This user hasn't uploaded Emoji Combos yet."}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-center text-white text-lg">
                                Emoji Combos will be displayed soon.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Sidebar - Badges and Activity */}
                  <div className="w-80 flex-shrink-0">
                    {/* Badges Section */}
                    {profile.user_badges && profile.user_badges.length > 0 && (
                      <div className="mb-8">
                        <div
                          className="relative bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20"
                          onMouseEnter={() => setShowAllBadges(true)}
                          onMouseLeave={() => setShowAllBadges(false)}
                        >
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                              Badges
                            </h3>
                          </div>
                          
                          {/* Grid Layout for Badges - Icons Only */}
                          <div className="grid grid-cols-4 gap-3">
                            {(showAllBadges
                              ? profile.user_badges
                              : profile.user_badges.slice(0, 8)
                            ).map((ub, idx) => (
                              <div
                                key={idx}
                                className={`relative transition-all duration-300 group ${
                                  showAllBadges
                                    ? "transform scale-105 hover:scale-110"
                                    : idx >= 8
                                    ? "opacity-0 w-0 overflow-hidden"
                                    : ""
                                }`}
                              >
                                <img
                                  src={ub.badges.image_url || "/placeholder.svg"}
                                  alt={ub.badges.name}
                                  title={ub.badges.name}
                                  className="h-10 w-10 rounded-full border-2 border-white/20 cursor-pointer hover:border-white/40 transition-all duration-200 hover:scale-110"
                                />
                                
                                {/* Hover Popup */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                  <div className="bg-black/95 backdrop-blur-md rounded-lg p-3 border border-white/10 shadow-xl min-w-max">
                                    <p className="text-white text-sm font-medium text-center">
                                      {ub.badges.name}
                                    </p>
                                    <p className="text-gray-400 text-xs text-center mt-1">
                                      Badge
                                    </p>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/95"></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {!showAllBadges && profile.user_badges.length > 8 && (
                              <div className="relative group">
                                <div className="h-10 w-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-xs text-white font-bold cursor-pointer hover:bg-white/20 hover:border-white/40 transition-all duration-200">
                                  +{profile.user_badges.length - 8}
                                </div>
                                
                                {/* Hover Popup for More */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                  <div className="bg-black/95 backdrop-blur-md rounded-lg p-3 border border-white/10 shadow-xl min-w-max">
                                    <p className="text-white text-sm font-medium text-center">
                                      More Badges
                                    </p>
                                    <p className="text-gray-400 text-xs text-center mt-1">
                                      {profile.user_badges.length - 8} additional
                                    </p>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/95"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}

                    {/* Recent Activity Section */}
                    <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        Recent Activity
                      </h3>
                      {recentActivity?.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm">
                            No recent activity
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentActivity.slice(0, 5).map((activity, index) => (
                            <div
                              key={index}
                              className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                                  <Activity className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white text-sm font-medium">
                                    {activity.action}
                                  </p>
                                  <p className="text-gray-400 text-xs">
                                    {activity.timestamp}
                                  </p>
                                </div>
                                {activity.type === 'upload' && (
                                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                                    <img
                                      src={activity.image_url}
                                      alt="Activity"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal - Using gallery.tsx style */}
        <Transition appear show={isModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={closePreview}
          >
            <div className="min-h-screen px-4 text-center bg-black bg-opacity-80 backdrop-blur-sm">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="inline-block w-full max-w-4xl my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl border border-slate-700">
                  <div className="relative">
                    {/* Close Button */}
                    <button
                      onClick={closePreview}
                      className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                    >
                      <X className="w-6 h-6" />
                    </button>

                    {previewItem && "image_url" in previewItem ? (
                      // Single image preview
                      <>
                        <div className="relative aspect-video overflow-hidden bg-slate-800">
                          <img
                            src={previewItem.image_url || "/placeholder.svg"}
                            alt={previewItem.title || "Preview image"}
                            className={`w-full h-full object-contain transition-transform duration-300 ${
                              imageZoom ? 'scale-150' : 'scale-100'
                            }`}
                            style={{ transform: `rotate(${imageRotation}deg)` }}
                          />
                          
                          {/* Image Controls */}
                          <div className="absolute top-4 left-4 flex gap-2">
                            <button
                              onClick={() => setImageZoom(!imageZoom)}
                              className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                              title={imageZoom ? "Zoom out" : "Zoom in"}
                            >
                              <ZoomIn className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setImageRotation(prev => prev + 90)}
                              className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                              title="Rotate"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-2">
                                {previewItem.title || "Untitled"}
                              </h3>
                              <p className="text-gray-300 mb-4">
                                {previewItem.category || "No category"}
                              </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDownload(previewItem)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </button>
                              <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              >
                                <Share2 className="h-4 w-4" />
                                Share
                              </button>
                            </div>
                          </div>

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
                            <p className="text-sm text-gray-400">
                              Created on {formatDate(previewItem.created_at)}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      // Profile pair preview (banner + pfp)
                      previewItem &&
                      "pfp_url" in previewItem && (
                        <>
                          <div className="relative">
                            {previewItem.banner_url && (
                              <img
                                src={
                                  previewItem.banner_url || "/placeholder.svg"
                                }
                                alt={`${previewItem.title} banner`}
                                className="w-full h-64 object-cover brightness-75"
                                loading="lazy"
                              />
                            )}
                            {previewItem.pfp_url && (
                              <img
                                src={previewItem.pfp_url || "/placeholder.svg"}
                                alt={`${previewItem.title} profile`}
                                className="w-32 h-32 rounded-full border-4 border-purple-500 absolute top-48 left-1/2 transform -translate-x-1/2 bg-slate-900 z-10"
                                loading="lazy"
                              />
                            )}
                          </div>

                          <div className="pt-20 pb-8 px-6 text-center">
                            <Dialog.Title
                              as="h3"
                              className="text-3xl font-bold leading-12 text-white mb-5"
                            >
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

                            <div className="flex justify-center gap-6">
                              <button
                                type="button"
                                className="inline-flex justify-center px-8 py-3 text-sm font-semibold text-purple-400 bg-transparent border border-purple-600 rounded-lg hover:bg-purple-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                                onClick={closePreview}
                              >
                                Close
                              </button>
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

        {/* Enhanced Report Modal */}
        <EnhancedReportModal
          isOpen={isReportModalOpen}
          onClose={closeReportModal}
          reporterUserId={currentUserProfileId || ''}
          reportedUserId={profile?.id}
          reportedUsername={profile?.username || ''}
          onReportSubmitted={() => {
            closeReportModal();
          }}
        />
      </div>
      <Footer />
    </>
  );
}
