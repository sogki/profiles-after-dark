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
  Share2,
  Users,
} from "lucide-react";
import { Fragment, useState } from "react";
import { BsFillEmojiHeartEyesFill } from "react-icons/bs";
import { Link } from "react-router-dom";
// import { supabase } from "../../lib/supabase";
import EnhancedReportModal from "../moderation/modals/EnhancedReportModal";
import { useFollows } from "../../hooks/useFollows";
import { useShare } from "../../hooks/useShare";

import useRetrieveProfileFavorites from "@/hooks/users/profile-info/use-retrieve-profile-favorites";
import useRetrieveProfilePairs from "@/hooks/users/profile-info/use-retrieve-profile-pairs";
import useRetrieveProfileUploads from "@/hooks/users/profile-info/use-retrieve-profile-uploads";
import useRetrieveUserProfile from "@/hooks/users/profile-info/use-retrieve-user-profile";
import Footer from "../Footer";

interface Badge {
  name: string;
  image_url: string;
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
  created_at?: string;
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

interface ProfilePair {
  id: string;
  user_id: string;
  pfp_url: string | null;
  banner_url: string | null;
  title: string | null;
  category: string | null;
  tags?: string[];
  created_at?: string;
}

interface UserEmojiUpload {
  id: string;
  user_id: string;
  name: string;
  combo_text: string | null;
  description: string | null;
  tags?: string[];
  created_at?: string;
}

export default function UserProfile() {
  const {
    data: profile,
    isLoading: profileLoading,
    currentUser: { id: currentUserProfileId },
  } = useRetrieveUserProfile();

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

  // Follow functionality
  const { stats: followStats, toggleFollow, loading: followLoading } = useFollows(profile?.user_id);
  const { shareProfile } = useShare();

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

  const isOwnProfile = currentUserProfileId === profile.id;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
          {/* Profile Header */}
          <div className="relative mb-6 md:mb-8">
            {/* Banner */}
            <div className="relative h-48 sm:h-64 md:h-80 rounded-xl md:rounded-2xl overflow-y-visible bg-gradient-to-r from-purple-600 to-blue-600">
              {profile.banner_url ? (
                <img
                  src={profile.banner_url || "/placeholder.svg"}
                  alt={`${profile.username}'s banner`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <div className="text-white/20 text-6xl">
                    <User />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20"></div>

              {/* Avatar */}
              <img
                src={profile.avatar_url || "/default-avatar.png"}
                alt={`${profile.username}'s avatar`}
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-white absolute top-36 sm:top-48 md:top-60 left-1/2 sm:left-1/2 md:left-40 transform -translate-x-1/2 md:translate-x-0 border-solid bg-slate-900 shadow-xl object-cover"
              />
            </div>

            {/* Profile Info */}
            <div className="relative px-4 sm:px-6 pb-4 sm:pb-6">
              {/* Action Buttons */}
              <div className="absolute -top-2 sm:-top-4 right-4 sm:right-6 flex items-center gap-2">
                {!isOwnProfile && (
                  <>
                    <button
                      onClick={() => profile?.username && shareProfile(profile.username)}
                      className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors"
                      title="Share profile"
                    >
                      <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => profile?.user_id && toggleFollow(profile.user_id)}
                      disabled={followLoading}
                      className={`inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-full font-semibold transition-colors shadow-lg text-sm sm:text-base ${
                        followStats.isFollowing
                          ? "bg-slate-700 text-white hover:bg-slate-600"
                          : "bg-purple-600 text-white hover:bg-purple-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {followStats.isFollowing ? (
                        <>
                          <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Unfollow</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Follow</span>
                        </>
                      )}
                    </button>
                  </>
                )}
                {isOwnProfile ? (
                  <Link
                    to="/profile-settings"
                    className="inline-flex items-center gap-2 bg-white text-gray-900 px-3 py-2 sm:px-4 sm:py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg text-sm sm:text-base"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Edit Profile</span>
                    <span className="sm:hidden">Edit</span>
                  </Link>
                ) : (
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
                              onClick={() => profile?.username && shareProfile(profile.username)}
                              className={`${
                                active
                                  ? "bg-gray-50 text-gray-900"
                                  : "text-gray-700"
                              } flex items-center gap-3 w-full px-4 py-3 text-left text-sm rounded-xl`}
                            >
                              <Share2 className="h-4 w-4" />
                              Share Profile
                            </button>
                          )}
                        </Menu.Item>
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
                )}
              </div>

              {/* Profile Details */}
              <div className="pt-16 sm:pt-20 text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    @{profile.username}
                  </h1>
                  {profile.user_badges && profile.user_badges.length > 0 && (
                    <div
                      className="relative"
                      onMouseEnter={() => setShowAllBadges(true)}
                      onMouseLeave={() => setShowAllBadges(false)}
                    >
                      <div
                        className={`flex gap-1 transition-all duration-300 ${
                          showAllBadges ? "flex-wrap" : ""
                        }`}
                      >
                        {(showAllBadges
                          ? profile.user_badges
                          : profile.user_badges.slice(0, 3)
                        ).map((ub, idx) => (
                          <div
                            key={idx}
                            className={`transition-all duration-300 ${
                              showAllBadges
                                ? "transform scale-110 hover:scale-125"
                                : idx >= 3
                                ? "opacity-0 w-0 overflow-hidden"
                                : ""
                            }`}
                          >
                            <img
                              src={ub.badges.image_url || "/placeholder.svg"}
                              alt={ub.badges.name}
                              title={ub.badges.name}
                              className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-white/20 cursor-pointer"
                            />
                          </div>
                        ))}
                        {!showAllBadges && profile.user_badges.length > 3 && (
                          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-xs text-white font-semibold cursor-pointer hover:bg-white/20 transition-colors">
                            +{profile.user_badges.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Expanded badges tooltip */}
                      {showAllBadges && profile.user_badges.length > 3 && (
                        <div className="absolute top-full left-0 mt-2 bg-black/80 backdrop-blur-sm rounded-lg p-3 z-10 min-w-max">
                          <div className="grid grid-cols-4 gap-2">
                            {profile.user_badges.map((ub, idx) => (
                              <div key={idx} className="text-center">
                                <img
                                  src={
                                    ub.badges.image_url || "/placeholder.svg"
                                  }
                                  alt={ub.badges.name}
                                  className="h-10 w-10 rounded-full border-2 border-white/20 mx-auto mb-1"
                                />
                                <p className="text-xs text-white truncate max-w-[60px]">
                                  {ub.badges.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-gray-300 text-base sm:text-lg mb-4 max-w-2xl mx-auto px-4">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Joined{" "}
                      {profile.created_at
                        ? formatDate(profile.created_at)
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    <span className="text-sm">
                      {uploads?.length || 0} uploads
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">
                      {favorites?.length || 0} favorites
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {followStats.followers} followers
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="text-sm">
                      {followStats.following} following
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="mb-6 md:mb-8">
            <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-xl p-1 overflow-x-auto no-scrollbar">
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
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                  <span
                    className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                      activeTab === tab.id
                        ? "bg-gray-100 text-gray-600"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
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
                        ? "You haven't uploaded anything yet."
                        : "This user hasn't uploaded anything yet."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                    {uploads?.map((upload) => (
                      <div
                        key={upload.id}
                        className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer hover:scale-105"
                        onClick={() => openPreview(upload as UserUpload)}
                      >
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={upload.image_url || "/placeholder.svg"}
                            alt={upload.title || "Upload image"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-2 sm:p-4">
                          <h3 className="font-semibold text-white mb-1 truncate text-sm sm:text-base">
                            {upload.title || "Untitled"}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400 mb-2">
                            {upload.category || "No category"}
                          </p>
                          {upload.tags && upload.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {upload.tags.slice(0, 2).map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {upload.tags.length > 2 && (
                                <span className="text-xs text-gray-400">
                                  +{upload.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Pairs Tab - Using gallery.tsx style */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {profilePairs?.map((pair) => (
                      <div
                        key={pair.id}
                        className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 border border-slate-700 hover:border-slate-600 cursor-pointer"
                        style={{ minHeight: "280px" }}
                        onClick={() => openPreview(pair as ProfilePair)}
                      >
                        {pair.banner_url ? (
                          <img
                            src={pair.banner_url || "/placeholder.svg"}
                            alt={`${pair.title} banner`}
                            className="w-full h-40 object-cover brightness-75 group-hover:brightness-90 transition-all duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-gray-400">
                            No Banner
                          </div>
                        )}

                        {pair.pfp_url && (
                          <img
                            src={pair.pfp_url || "/placeholder.svg"}
                            alt={`${pair.title} profile`}
                            className="w-24 h-24 rounded-full border-4 border-purple-500 absolute top-28 left-1/2 transform -translate-x-1/2 border-solid bg-slate-900 group-hover:border-purple-400 transition-colors"
                            loading="lazy"
                          />
                        )}

                        <div className="pt-16 sm:pt-20 pb-4 sm:pb-6 px-4 sm:px-6 text-center">
                          <h3 className="text-white font-semibold text-lg sm:text-xl truncate mb-2 sm:mb-3">
                            {pair.title || "Untitled"}
                          </h3>

                          <div className="flex flex-wrap justify-center gap-1 mb-4 max-h-16 overflow-auto px-2">
                            {(pair.tags || []).map((tag) => (
                              <span
                                key={tag}
                                className="bg-purple-700/30 text-purple-200 text-xs px-2 py-0.5 rounded-full select-none whitespace-nowrap border border-purple-600/30"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
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
                        ? "You haven't favorited anything yet."
                        : "This user hasn't favorited anything yet."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                    {favorites?.map((fav) => (
                      <div
                        key={fav.id}
                        className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer hover:scale-105"
                        onClick={() => openPreview(fav?.upload as UserUpload)}
                      >
                        <div className="aspect-square overflow-hidden relative">
                          <img
                            src={fav?.upload?.image_url || "/placeholder.svg"}
                            alt={fav?.upload?.title || "Favorite image"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2">
                            <Heart className="h-5 w-5 text-red-500 fill-current" />
                          </div>
                        </div>
                        <div className="p-2 sm:p-4">
                          <h3 className="font-semibold text-white mb-1 truncate text-sm sm:text-base">
                            {fav?.upload?.title || "Untitled"}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400">
                            {fav?.upload?.category || "No category"}
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
                  // <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={previewItem.image_url || "/placeholder.svg"}
                            alt={previewItem.title || "Preview image"}
                            className="w-full h-full object-contain bg-slate-800"
                          />
                        </div>
                        <div className="p-6">
                          <h3 className="text-2xl font-bold text-white mb-2">
                            {previewItem.title || "Untitled"}
                          </h3>
                          <p className="text-gray-300 mb-4">
                            {previewItem.category || "No category"}
                          </p>

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
                                className="w-32 h-32 rounded-full border-4 border-purple-500 absolute top-48 left-1/2 transform -translate-x-1/2 bg-slate-900"
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
