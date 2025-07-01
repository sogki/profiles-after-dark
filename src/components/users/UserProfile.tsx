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
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { BsFillEmojiHeartEyesFill } from "react-icons/bs";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

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
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [favorites, setFavorites] = useState<UserUpload[]>([]);
  const [profilePairs, setProfilePairs] = useState<ProfilePair[]>([]);
  const [emojicombos, setEmojiCombos] = useState<UserEmojiUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<
    UserUpload | ProfilePair | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<
    string | null
  >(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "uploads" | "pairs" | "favorites" | "emojicombos"
  >("uploads");
  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    const getCurrentUserProfile = async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData.user) {
        setCurrentUser(null);
        setCurrentUserProfileId(null);
        return;
      }

      setCurrentUser({
        id: authData.user.id,
        username: authData.user.user_metadata?.username || "",
      });

      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", authData.user.id)
        .single();

      if (profileError || !profileData) {
        setCurrentUserProfileId(null);
        return;
      }

      setCurrentUserProfileId(profileData.id);
    };

    getCurrentUserProfile();
  }, []);

  useEffect(() => {
    if (!username) return;

    const fetchProfileAndUploads = async () => {
      setLoading(true);

      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select(
          `
          id,
          user_id,
          username,
          avatar_url,
          banner_url,
          bio,
          created_at,
          user_badges (
            badges (
              name,
              image_url
            )
          )
        `
        )
        .eq("username", username)
        .single();

      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError);
        setProfile(null);
        setUploads([]);
        setFavorites([]);
        setProfilePairs([]);
        setEmojiCombos([]);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch uploads
      const { data: uploadsData, error: uploadsError } = await supabase
        .from("profiles")
        .select("id, title, image_url, tags, category, type, created_at")
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false });

      if (uploadsError) {
        console.error("Error fetching uploads:", uploadsError);
        setUploads([]);
      } else {
        setUploads(uploadsData || []);
      }

      // Fetch profile pairs
      const { data: pairsData, error: pairsError } = await supabase
        .from("profile_pairs")
        .select(
          "id, user_id, pfp_url, banner_url, title, category, tags, created_at"
        )
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false });

      if (pairsError) {
        console.error("Error fetching profile pairs:", pairsError);
        setProfilePairs([]);
      } else {
        setProfilePairs(pairsData || []);
      }

      // Fetch favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("favorites")
        .select(
          `
          id,
          upload:profiles (
            id,
            title,
            image_url,
            tags,
             category,
            type,
            created_at
          )
        `
        )
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false });

      if (favoritesError) {
        console.error("Error fetching favorites:", favoritesError);
        setFavorites([]);
      } else {
        const favs = favoritesData?.map((fav: any) => fav.upload) || [];
        setFavorites(favs);
      }

      setLoading(false);
    };

    fetchProfileAndUploads();
  }, [username]);

  const openPreview = (item: UserUpload | ProfilePair) => {
    setPreviewItem(item);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewItem(null);
  };

  const openReportModal = () => {
    setReportReason("");
    setReportError(null);
    setReportSuccess(false);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
  };

  const submitReport = async () => {
    setReportError(null);
    setReportSuccess(false);

    if (!currentUserProfileId) {
      setReportError("You must be logged in to submit a report.");
      return;
    }

    if (!profile) {
      setReportError("Reported user profile not found.");
      return;
    }

    if (reportReason.trim().length === 0) {
      setReportError("Please provide a reason for the report.");
      return;
    }

    setReportSubmitting(true);

    const { error } = await supabase.from("reports").insert({
      reporter_user_id: currentUserProfileId,
      reported_user_id: profile.id,
      handled_by: null,
      reason: reportReason.trim(),
      created_at: new Date().toISOString(),
    });

    setReportSubmitting(false);

    if (error) {
      console.error("Error submitting report:", error);
      setReportError("Failed to submit report. Please try again later.");
    } else {
      setReportSuccess(true);
      setReportReason("");
      setTimeout(() => {
        closeReportModal();
      }, 2000);
    }
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
                className="w-40 h-40 rounded-full border-4 border-white absolute top-60 left-40 transform -translate-x-1/2 border-solid bg-slate-900 shadow-xl object-cover"
              />
            </div>

            {/* Profile Info */}
            <div className="relative px-6 pb-6">
              {/* Action Button */}
              <div className="absolute -top-4 right-6">
                {isOwnProfile ? (
                  <Link
                    to="/profile-settings"
                    className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Link>
                ) : (
                  <Menu as="div" className="relative">
                    <Menu.Button className="inline-flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors">
                      <MoreHorizontal className="h-5 w-5" />
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
                )}
              </div>

              {/* Profile Details */}
              <div className="pt-20 text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
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
                              className="h-8 w-8 rounded-full border-2 border-white/20 cursor-pointer"
                            />
                          </div>
                        ))}
                        {!showAllBadges && profile.user_badges.length > 3 && (
                          <div className="h-8 w-8 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-xs text-white font-semibold cursor-pointer hover:bg-white/20 transition-colors">
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
                  <p className="text-gray-300 text-lg mb-4 max-w-2xl mx-auto">
                    {profile.bio}
                  </p>
                )}

                <div className="flex items-center justify-center gap-6 text-gray-400">
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
                    <span className="text-sm">{uploads.length} uploads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">
                      {favorites.length} favorites
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-xl p-1">
              {[
                {
                  id: "uploads",
                  label: "Uploads",
                  count: uploads.length,
                  icon: Grid3X3,
                },
                {
                  id: "pairs",
                  label: "Profile Pairs",
                  count: profilePairs.length,
                  icon: User,
                },
                {
                  id: "favorites",
                  label: "Favorites",
                  count: favorites.length,
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
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
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
                {uploads.length === 0 ? (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {uploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer hover:scale-105"
                        onClick={() => openPreview(upload)}
                      >
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={upload.image_url || "/placeholder.svg"}
                            alt={upload.title || "Upload image"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-white mb-1 truncate">
                            {upload.title || "Untitled"}
                          </h3>
                          <p className="text-sm text-gray-400 mb-2">
                            {upload.category || "No category"}
                          </p>
                          {upload.tags && upload.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {upload.tags.slice(0, 2).map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full"
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
                {profilePairs.length === 0 ? (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {profilePairs.map((pair) => (
                      <div
                        key={pair.id}
                        className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 border border-slate-700 hover:border-slate-600 cursor-pointer"
                        style={{ minHeight: "280px" }}
                        onClick={() => openPreview(pair)}
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

                        <div className="pt-20 pb-6 px-6 text-center">
                          <h3 className="text-white font-semibold text-xl truncate mb-3">
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
                {favorites.length === 0 ? (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favorites.map((fav) => (
                      <div
                        key={fav.id}
                        className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer hover:scale-105"
                        onClick={() => openPreview(fav)}
                      >
                        <div className="aspect-square overflow-hidden relative">
                          <img
                            src={fav.image_url || "/placeholder.svg"}
                            alt={fav.title || "Favorite image"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2">
                            <Heart className="h-5 w-5 text-red-500 fill-current" />
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-white mb-1 truncate">
                            {fav.title || "Untitled"}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {fav.category || "No category"}
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
                {favorites.length === 0 ? (
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

        {/* Report Modal */}
        <Transition appear show={isReportModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={closeReportModal}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Flag className="h-5 w-5 text-red-600" />
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Report User
                    </Dialog.Title>
                  </div>

                  <p className="text-gray-600 mb-4">
                    Please describe why you're reporting @{profile.username}.
                    Our team will review this report.
                  </p>

                  <textarea
                    rows={4}
                    placeholder="Describe the reason for reporting this user..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    disabled={reportSubmitting || reportSuccess}
                  />

                  {reportError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{reportError}</p>
                    </div>
                  )}

                  {reportSuccess && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-600 text-sm">
                        Report submitted successfully. Thank you for helping
                        keep our community safe.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={closeReportModal}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={reportSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitReport}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        reportSubmitting ||
                        reportSuccess ||
                        !reportReason.trim()
                      }
                    >
                      {reportSubmitting ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      </div>
      <Footer />
    </>
  );
}
