import { Dialog, Menu, Transition } from "@headlessui/react";
import {
  Calendar,
  Flag,
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
  Check,
  Copy,
  Image,
  ImageIcon,
  Smile,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { Fragment, useState, useEffect, useMemo } from "react";
import { BsFillEmojiHeartEyesFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useFollows } from "../../hooks/useFollows";
import { useShare } from "../../hooks/useShare";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/authContext";
import { useIsUserOnline } from "../../hooks/useOnlineStatus";

import useRetrieveProfileFavorites from "@/hooks/users/profile-info/use-retrieve-profile-favorites";
import useRetrieveProfilePairs from "@/hooks/users/profile-info/use-retrieve-profile-pairs";
import useRetrieveProfileUploads from "@/hooks/users/profile-info/use-retrieve-profile-uploads";
import useRetrieveProfileEmojiCombos from "@/hooks/users/profile-info/use-retrieve-profile-emoji-combos";
import useRetrieveProfileEmotes from "@/hooks/users/profile-info/use-retrieve-profile-emotes";
import useRetrieveProfileWallpapers from "@/hooks/users/profile-info/use-retrieve-profile-wallpapers";
import useRetrieveUserProfile from "@/hooks/users/profile-info/use-retrieve-user-profile";
import Footer from "../Footer";
import BadgeIcon from "../achievements/BadgeIcon";

interface Badge {
  id: string;
  name: string;
  image_url: string;
  code?: string | null;
  category?: string | null;
  rarity?: string | null;
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
  show_badges_on_profile?: boolean;
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

  const { data: emojicombos, isLoading: emojicombosLoading } =
    useRetrieveProfileEmojiCombos();

  const { data: emotes, isLoading: emotesLoading } =
    useRetrieveProfileEmotes();

  const { data: wallpapers, isLoading: wallpapersLoading } =
    useRetrieveProfileWallpapers();

  const loading =
    profileLoading || uploadsLoading || profilePairsLoading || favoritesLoading || emojicombosLoading || emotesLoading || wallpapersLoading;
  const [previewItem, setPreviewItem] = useState<
    UserUpload | ProfilePair | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    "pairs" | "pfps" | "banners" | "emotes" | "wallpapers" | "emojicombos" | "favorites"
  >("pairs");
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  
  // Followers/Following modal state
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<"followers" | "following">("followers");
  const [followList, setFollowList] = useState<any[]>([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);
  
  // Profile visibility state
  const [profileVisibility, setProfileVisibility] = useState<string>("public");
  const [isMutualFollow, setIsMutualFollow] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filtered data for PFPs and Banners
  const pfps = uploads?.filter((upload) => upload.type === "profile") || [];
  const banners = uploads?.filter((upload) => upload.type === "banner") || [];

  // Pagination helper function
  const getPaginatedData = <T,>(data: T[] | undefined): T[] => {
    if (!data) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Get total pages for pagination
  const getTotalPages = (data: any[] | undefined): number => {
    if (!data || data.length === 0) return 1;
    return Math.ceil(data.length / itemsPerPage);
  };

  // Reset to page 1 when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    setCurrentPage(1);
  };

  // Pagination component
  const Pagination = ({ totalPages, currentPage, onPageChange }: { totalPages: number; currentPage: number; onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/50 text-white transition-colors"
            >
              1
            </button>
            {startPage > 2 && <span className="text-slate-400">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              currentPage === page
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                : "bg-slate-800/60 hover:bg-slate-700/50 text-white"
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-slate-400">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/50 text-white transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  // Follow functionality
  const { stats: followStats, toggleFollow, loading: followLoading } = useFollows(profile?.user_id);
  const { shareProfile } = useShare();
  const { user } = useAuth();
  
  const isOwnProfile = currentUserProfileId === profile?.user_id;
  
  // Online status - only check if profile exists to prevent unnecessary re-renders
  const { isOnline } = useIsUserOnline(profile?.user_id || undefined);

  // Handle share with feedback
  const handleShare = async () => {
    if (profile?.username) {
      const success = await shareProfile(profile.username);
      if (success) {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    }
  };

  // Fetch followers or following list
  const fetchFollowList = async (type: "followers" | "following") => {
    if (!profile?.user_id) return;
    
    setLoadingFollowList(true);
    try {
      let query;
      if (type === "followers") {
        // Get users who follow this profile
        query = supabase
          .from("follows" as any)
          .select("follower_id, created_at")
          .eq("following_id", profile.user_id)
          .order("created_at", { ascending: false });
      } else {
        // Get users this profile is following
        query = supabase
          .from("follows" as any)
          .select("following_id, created_at")
          .eq("follower_id", profile.user_id)
          .order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get user profiles
      const userIds = type === "followers" 
        ? data.map((f: any) => f.follower_id)
        : data.map((f: any) => f.following_id);

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("user_profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", userIds);

        if (profileError) throw profileError;

        // Combine follow data with profile data
        const combined = data.map((follow: any) => {
          const userId = type === "followers" ? follow.follower_id : follow.following_id;
          const userProfile = profiles?.find((p: any) => p.user_id === userId);
          return {
            ...follow,
            user: userProfile || null,
          };
        });

        setFollowList(combined);
      } else {
        setFollowList([]);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      setFollowList([]);
    } finally {
      setLoadingFollowList(false);
    }
  };

  // Open follow modal
  const openFollowModal = async (type: "followers" | "following") => {
    setFollowModalType(type);
    setShowFollowModal(true);
    await fetchFollowList(type);
  };

  // Check profile visibility and mutual follow status
  useEffect(() => {
    const checkProfileAccess = async () => {
      if (!profile?.user_id) {
        setCheckingAccess(false);
        return;
      }

      setCheckingAccess(true);

      try {
        // Get profile visibility setting
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("profile_visibility")
          .eq("user_id", profile.user_id)
          .single();

        const visibility = profileData?.profile_visibility || 
          JSON.parse(localStorage.getItem("privacy_settings") || "{}").profile_visibility || 
          "public";
        
        setProfileVisibility(visibility);

        // If it's the user's own profile, always allow access
        if (isOwnProfile) {
          setIsMutualFollow(true);
          setCheckingAccess(false);
          return;
        }

        // If visibility is public, allow access
        if (visibility === "public") {
          setIsMutualFollow(true);
          setCheckingAccess(false);
          return;
        }

        // If visibility is private, deny access
        if (visibility === "private") {
          setIsMutualFollow(false);
          setCheckingAccess(false);
          return;
        }

        // If visibility is "friends", check for mutual follow
        if (visibility === "friends" && user?.id) {
          // Check if current user follows profile owner
          const { data: currentUserFollows } = await supabase
            .from("follows" as any)
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", profile.user_id)
            .maybeSingle();

          // Check if profile owner follows current user
          const { data: profileOwnerFollows } = await supabase
            .from("follows" as any)
            .select("id")
            .eq("follower_id", profile.user_id)
            .eq("following_id", user.id)
            .maybeSingle();

          // Both must follow each other
          setIsMutualFollow(!!currentUserFollows && !!profileOwnerFollows);
        } else {
          setIsMutualFollow(false);
        }
      } catch (error) {
        console.error("Error checking profile access:", error);
        // Default to allowing access on error
        setIsMutualFollow(true);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkProfileAccess();
  }, [profile?.user_id, user?.id, isOwnProfile]);

  const openPreview = (item: UserUpload | ProfilePair) => {
    setPreviewItem(item);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewItem(null);
  };

  const openReportModal = () => {
    navigate('/report-form', {
      state: {
        reportedUserId: profile?.id,
        reportedUsername: profile?.username
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading || checkingAccess) {
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

  // Check if user has access to view this profile
  const hasAccess = isOwnProfile || profileVisibility === "public" || 
    (profileVisibility === "friends" && isMutualFollow);
  
  // Show access denied message if user doesn't have access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="h-24 w-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700">
              <User className="h-12 w-12 text-slate-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile is Private</h2>
          <p className="text-gray-400 mb-6">
            {profileVisibility === "private" 
              ? "This profile is set to private. Only the owner can view it."
              : "This profile is only visible to friends. You need to follow each other to view this profile."}
          </p>
          {!user && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Sign in to view
            </Link>
          )}
        </div>
      </div>
    );
  }

  // OpenGraph meta tags
  const profileUrl = `https://profilesafterdark.com/user/${profile.username}`;
  const profileImage = profile.avatar_url || profile.banner_url || "https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles_after_dark_logo.png";
  const profileDescription = profile.bio || `Check out @${profile.username}'s profile on Profiles After Dark`;

  return (
    <>
      <Helmet>
        <title>{`@${profile.username} | Profiles After Dark`}</title>
        <meta name="description" content={profileDescription} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={profileUrl} />
        <meta property="og:title" content={`@${profile.username} | Profiles After Dark`} />
        <meta property="og:description" content={profileDescription} />
        <meta property="og:image" content={profileImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`@${profile.username} | Profiles After Dark`} />
        <meta name="twitter:description" content={profileDescription} />
        <meta name="twitter:image" content={profileImage} />
        <link rel="canonical" href={profileUrl} />
      </Helmet>
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
          {/* Profile Header */}
          <div className="relative mb-6 md:mb-8">
            {/* Banner Container with overflow for rounded corners */}
            <div className="relative h-48 sm:h-64 md:h-80 rounded-xl md:rounded-2xl overflow-visible bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 shadow-2xl">
              <div className="relative h-full w-full overflow-hidden rounded-xl md:rounded-2xl">
                {profile.banner_url ? (
                  <img
                    src={profile.banner_url || "/placeholder.svg"}
                    alt={`${profile.username}'s banner`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 flex items-center justify-center">
                    <div className="text-white/20 text-6xl">
                      <User />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              </div>
              
              {/* Avatar - positioned relative to banner, half on/half off */}
              <div className="absolute w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 left-1/2 sm:left-1/2 md:left-40 transform -translate-x-1/2 md:translate-x-0 z-10 bottom-[-3rem] sm:bottom-[-4rem] md:bottom-[-5rem]">
                <div className="relative w-full h-full">
                  <motion.img
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={profile.avatar_url || "/default-avatar.png"}
                    alt={`${profile.username}'s avatar`}
                    className="w-full h-full rounded-full border-4 border-slate-900 shadow-2xl object-cover bg-slate-800"
                  />
                  {/* Online status indicator - positioned absolutely on bottom right of the image */}
                  {isOnline && (
                    <div className="absolute bottom-5 right-5 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-green-500 rounded-full border-2 border-slate-900 shadow-lg z-20 pointer-events-none translate-x-1/4 translate-y-1/4">
                      <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75 pointer-events-none"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons - positioned outside banner container to prevent dropdown clipping, half on/half off banner like profile picture */}
            <div className="absolute right-4 sm:right-6 flex items-center gap-2 z-20 top-36 sm:top-48 md:top-60">
                {!isOwnProfile && (
                  <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                      onClick={() => profile?.user_id && toggleFollow(profile.user_id)}
                      disabled={followLoading}
                    className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-xl font-semibold transition-all shadow-lg text-sm sm:text-base ${
                        followStats.isFollowing
                        ? "bg-slate-700/90 backdrop-blur-md text-white hover:bg-slate-600 border border-slate-600"
                        : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 border border-purple-500/50"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                    {followLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : followStats.isFollowing ? (
                        <>
                        <UserMinus className="h-4 w-4" />
                          <span className="hidden sm:inline">Unfollow</span>
                        </>
                      ) : (
                        <>
                        <UserPlus className="h-4 w-4" />
                          <span className="hidden sm:inline">Follow</span>
                        </>
                      )}
                  </motion.button>
                  <Menu as="div" className="relative z-30">
                    <Menu.Button className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/90 backdrop-blur-md text-white rounded-xl hover:bg-slate-700 transition-colors shadow-lg border border-slate-700">
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
                      <Menu.Items className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-md rounded-xl shadow-2xl ring-1 ring-slate-700 focus:outline-none z-[100] border border-slate-700">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleShare}
                              className={`${
                                active
                                  ? "bg-slate-700 text-white"
                                  : "text-slate-300"
                              } flex items-center gap-3 w-full px-4 py-3 text-left text-sm rounded-xl transition-colors`}
                            >
                              {shareCopied ? (
                                <>
                                  <Check className="h-4 w-4 text-green-400" />
                                  Link Copied!
                                </>
                              ) : (
                                <>
                              <Share2 className="h-4 w-4" />
                              Share Profile
                                </>
                              )}
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={openReportModal}
                              className={`${
                                active
                                  ? "bg-red-500/20 text-red-400"
                                  : "text-slate-300"
                              } flex items-center gap-3 w-full px-4 py-3 text-left text-sm rounded-xl transition-colors`}
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
              {isOwnProfile && (
                <Link
                  to="/profile-settings"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg text-sm sm:text-base border border-purple-500/50"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </Link>
                )}
              </div>

            {/* Profile Info */}
            <div className="relative px-4 sm:px-6 pb-4 sm:pb-6 mt-0">
              <div className="pt-16 sm:pt-20 md:pt-24">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                  {/* Left side - Profile info */}
                  <div className="flex-1 md:max-w-2xl">
                    {/* Username and Special Badges - Inline horizontal flow */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                        @{profile.username}
                      </h1>
                      
                      {/* Special Badges - Only show special category badges (admin, staff, member, verified, bug_tester) */}
                      {profile.show_badges_on_profile !== false && profile.user_badges && Array.isArray(profile.user_badges) && (() => {
                        // Get all special badges
                        const allSpecialBadges = (profile.user_badges as UserBadge[]).filter(
                          (ub: any) => {
                            const badgeCode = ub.badges?.code || '';
                            const badgeCategory = ub.badges?.category || '';
                            return badgeCategory === 'special' || ['admin', 'staff', 'member', 'verified', 'bug_tester'].includes(badgeCode);
                          }
                        );
                        
                        if (allSpecialBadges.length === 0) return null;
                        
                        // Role badge hierarchy (highest to lowest)
                        const roleBadgeOrder: Record<string, number> = {
                          'admin': 3,
                          'staff': 2,
                          'member': 1
                        };
                        
                        // Separate role badges from independent special badges
                        const roleBadges = allSpecialBadges.filter((ub: any) => {
                          const badgeCode = ub.badges?.code || '';
                          return ['admin', 'staff', 'member'].includes(badgeCode);
                        });
                        
                        const independentBadges = allSpecialBadges.filter((ub: any) => {
                          const badgeCode = ub.badges?.code || '';
                          return ['verified', 'bug_tester'].includes(badgeCode);
                        });
                        
                        // Get only the highest role badge
                        let highestRoleBadge: any = null;
                        if (roleBadges.length > 0) {
                          highestRoleBadge = roleBadges.reduce((highest: any, current: any) => {
                            const currentCode = current.badges?.code || '';
                            const highestCode = highest?.badges?.code || '';
                            const currentOrder = roleBadgeOrder[currentCode] || 0;
                            const highestOrder = roleBadgeOrder[highestCode] || 0;
                            return currentOrder > highestOrder ? current : highest;
                          });
                        }
                        
                        // Combine highest role badge with independent badges
                        const specialBadges = highestRoleBadge 
                          ? [highestRoleBadge, ...independentBadges]
                          : independentBadges;
                        
                        if (specialBadges.length === 0) return null;
                        
                        return (
                          <div className="relative inline-flex items-center gap-1.5 sm:gap-2">
                            {specialBadges.map((ub: any, idx: number) => (
                              <div
                                key={ub.badges?.id || idx}
                                className="relative group cursor-pointer"
                                onMouseEnter={(e) => {
                                  const tooltip = e.currentTarget.querySelector('.badge-tooltip') as HTMLElement;
                                  if (tooltip) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    
                                    // Temporarily make tooltip visible off-screen to measure it
                                    tooltip.style.visibility = 'visible';
                                    tooltip.style.opacity = '0';
                                    tooltip.style.display = 'block';
                                    tooltip.style.top = '0px';
                                    tooltip.style.left = '0px';
                                    
                                    // Force a reflow to get accurate dimensions
                                    void tooltip.offsetHeight;
                                    
                                    const tooltipRect = tooltip.getBoundingClientRect();
                                    const tooltipHeight = tooltipRect.height || 32;
                                    const tooltipWidth = tooltipRect.width || 100;
                                    const spacing = 8;
                                    const viewportWidth = window.innerWidth;
                                    const padding = 8;
                                    
                                    // Calculate position
                                    let leftPos = rect.left + rect.width / 2;
                                    let transformX = -50; // Center by default
                                    
                                    // Constrain to viewport - adjust if tooltip would overflow
                                    if (leftPos - tooltipWidth / 2 < padding) {
                                      // Too far left, align to left edge
                                      leftPos = padding + tooltipWidth / 2;
                                      transformX = -50;
                                    } else if (leftPos + tooltipWidth / 2 > viewportWidth - padding) {
                                      // Too far right, align to right edge
                                      leftPos = viewportWidth - padding - tooltipWidth / 2;
                                      transformX = -50;
                                    }
                                    
                                    // Position tooltip above the badge
                                    tooltip.style.top = `${rect.top - tooltipHeight - spacing}px`;
                                    tooltip.style.left = `${leftPos}px`;
                                    tooltip.style.transform = `translate(${transformX}%, 0)`;
                                    tooltip.style.opacity = '1';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  const tooltip = e.currentTarget.querySelector('.badge-tooltip') as HTMLElement;
                                  if (tooltip) {
                                    tooltip.style.opacity = '0';
                                    tooltip.style.visibility = 'hidden';
                                  }
                                }}
                              >
                                <BadgeIcon
                                  code={ub.badges?.code || null}
                                  category={ub.badges?.category || null}
                                  rarity={(ub.badges?.rarity || 'common') as any}
                                  size={32}
                                  className="cursor-pointer"
                                />
                                {/* Badge name tooltip */}
                                <div className="badge-tooltip fixed px-2 py-1 bg-slate-900/95 backdrop-blur-sm rounded text-xs text-white whitespace-nowrap opacity-0 transition-opacity pointer-events-none z-[99999] border border-slate-700 shadow-lg"
                                  style={{
                                    visibility: 'hidden',
                                    top: '-9999px',
                                    left: '-9999px'
                                  }}
                                >
                                  {ub.badges?.name}
                                  {/* Arrow pointing down to the badge */}
                                  <div className="badge-tooltip-arrow absolute w-2 h-2 bg-slate-900 border-r border-b border-slate-700"
                                    style={{
                                      bottom: '-4px',
                                      left: '50%',
                                      transform: 'translateX(-50%) rotate(45deg)'
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Bio - Left aligned */}
                    {profile.bio && (
                      <p className="text-slate-300 text-sm sm:text-base mb-3 leading-relaxed">
                        {profile.bio}
                      </p>
                    )}

                    {/* Stats - Compact horizontal flow like Discord */}
                    <div className="flex items-center gap-4 sm:gap-5 mt-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300 transition-colors cursor-default">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          Joined {profile.created_at ? formatDate(profile.created_at) : "Unknown"}
                        </span>
                      </div>
                      
                      <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                      
                      <div 
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                        onClick={() => openFollowModal("followers")}
                      >
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium text-white">{followStats.followers}</span>
                        <span className="text-sm">followers</span>
                      </div>
                      
                      <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                      
                      <div 
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                        onClick={() => openFollowModal("following")}
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="text-sm font-medium text-white">{followStats.following}</span>
                        <span className="text-sm">following</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Achievements */}
                  {profile.show_badges_on_profile !== false && profile.user_badges && Array.isArray(profile.user_badges) && (() => {
                    // Filter out special badges from the display (they show next to username)
                    const allAchievementBadges = (profile.user_badges as UserBadge[]).filter(
                      (ub: any) => {
                        const badgeCode = ub.badges?.code || '';
                        const badgeCategory = ub.badges?.category || '';
                        return badgeCategory !== 'special' && !['admin', 'staff', 'member', 'verified', 'bug_tester'].includes(badgeCode);
                      }
                    );
                    
                    // Milestone badge order (lowest to highest)
                    const milestoneOrder: Record<string, number> = {
                      'week_old': 1,
                      'month_old': 2,
                      'seasoned_member': 3,
                      'veteran': 4,
                      'one_year_club': 5
                    };
                    
                    // Separate milestone badges from other badges
                    const milestoneBadges = allAchievementBadges.filter((ub: any) => {
                      const badgeCategory = ub.badges?.category || '';
                      return badgeCategory === 'milestone';
                    });
                    
                    const nonMilestoneBadges = allAchievementBadges.filter((ub: any) => {
                      const badgeCategory = ub.badges?.category || '';
                      return badgeCategory !== 'milestone';
                    });
                    
                    // Get only the highest milestone badge
                    let highestMilestoneBadge: any = null;
                    if (milestoneBadges.length > 0) {
                      highestMilestoneBadge = milestoneBadges.reduce((highest: any, current: any) => {
                        const currentCode = current.badges?.code || '';
                        const highestCode = highest?.badges?.code || '';
                        const currentOrder = milestoneOrder[currentCode] || 0;
                        const highestOrder = milestoneOrder[highestCode] || 0;
                        return currentOrder > highestOrder ? current : highest;
                      });
                    }
                    
                    // Combine non-milestone badges with only the highest milestone badge
                    const achievementBadges = highestMilestoneBadge 
                      ? [...nonMilestoneBadges, highestMilestoneBadge]
                      : nonMilestoneBadges;
                    
                    // Total badge count including special badges (but only highest milestone for display)
                    const totalBadgeCount = (profile.user_badges as UserBadge[]).length;
                    
                    if (achievementBadges.length === 0 && totalBadgeCount === 0) return null;
                    
                    return (
                      <div className="md:w-64 lg:w-80 flex-shrink-0">
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-700/50 shadow-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Trophy className="h-4 w-4 text-purple-400" />
                            <h2 className="text-sm font-semibold text-white">Achievements</h2>
                            <span className="ml-auto text-xs text-slate-400">
                              {totalBadgeCount}
                            </span>
                          </div>
                          
                          <div className="relative">
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1"
                              style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(139, 92, 246, 0.3) transparent'
                              }}
                            >
                              {achievementBadges.map((ub: any, idx: number) => {
                                const badge = ub.badges;
                                return (
                                  <div
                                    key={badge?.id || idx}
                                    className="relative group cursor-pointer"
                                    onMouseEnter={(e) => {
                                      const tooltip = e.currentTarget.querySelector('.badge-tooltip') as HTMLElement;
                                      if (tooltip) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        
                                        // Temporarily make tooltip visible off-screen to measure it
                                        tooltip.style.visibility = 'visible';
                                        tooltip.style.opacity = '0';
                                        tooltip.style.display = 'block';
                                        tooltip.style.top = '0px';
                                        tooltip.style.left = '0px';
                                        
                                        // Force a reflow to get accurate dimensions
                                        void tooltip.offsetHeight;
                                        
                                        const tooltipRect = tooltip.getBoundingClientRect();
                                        const tooltipHeight = tooltipRect.height || 32;
                                        const tooltipWidth = tooltipRect.width || 100;
                                        const spacing = 8;
                                        const viewportWidth = window.innerWidth;
                                        const padding = 8;
                                        
                                        // Calculate position
                                        let leftPos = rect.left + rect.width / 2;
                                        let transformX = -50; // Center by default
                                        
                                        // Constrain to viewport - adjust if tooltip would overflow
                                        if (leftPos - tooltipWidth / 2 < padding) {
                                          // Too far left, align to left edge
                                          leftPos = padding + tooltipWidth / 2;
                                          transformX = -50;
                                        } else if (leftPos + tooltipWidth / 2 > viewportWidth - padding) {
                                          // Too far right, align to right edge
                                          leftPos = viewportWidth - padding - tooltipWidth / 2;
                                          transformX = -50;
                                        }
                                        
                                        // Position tooltip above the badge
                                        tooltip.style.top = `${rect.top - tooltipHeight - spacing}px`;
                                        tooltip.style.left = `${leftPos}px`;
                                        tooltip.style.transform = `translate(${transformX}%, 0)`;
                                        tooltip.style.opacity = '1';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      const tooltip = e.currentTarget.querySelector('.badge-tooltip') as HTMLElement;
                                      if (tooltip) {
                                        tooltip.style.opacity = '0';
                                        tooltip.style.visibility = 'hidden';
                                      }
                                    }}
                                  >
                                    <BadgeIcon
                                      code={badge?.code || null}
                                      category={badge?.category || null}
                                      rarity={(badge?.rarity || 'common') as any}
                                      size={32}
                                      className="cursor-pointer"
                                    />
                                    {/* Badge tooltip - positioned fixed to escape overflow container */}
                                    <div className="badge-tooltip fixed px-2 py-1 bg-slate-900/95 backdrop-blur-sm rounded text-xs text-white whitespace-nowrap opacity-0 transition-opacity pointer-events-none z-[99999] border border-slate-700 shadow-lg"
                                      style={{
                                        visibility: 'hidden',
                                        top: '-9999px',
                                        left: '-9999px'
                                      }}
                                    >
                                      {badge?.name}
                                      {/* Arrow pointing down to the badge */}
                                      <div className="badge-tooltip-arrow absolute w-2 h-2 bg-slate-900 border-r border-b border-slate-700"
                                        style={{
                                          bottom: '-4px',
                                          left: '50%',
                                          transform: 'translateX(-50%) rotate(45deg)'
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="mb-6 md:mb-8">
            <div className="flex space-x-1 bg-slate-800/60 backdrop-blur-sm rounded-xl p-1 overflow-x-auto no-scrollbar border border-slate-700/50 shadow-lg">
              {[
                {
                  id: "pairs",
                  label: "Profile Pairs",
                  count: profilePairs?.length || 0,
                  icon: User,
                },
                {
                  id: "pfps",
                  label: "PFPs",
                  count: pfps.length,
                  icon: Image,
                },
                {
                  id: "banners",
                  label: "Banners",
                  count: banners.length,
                  icon: ImageIcon,
                },
                {
                  id: "emotes",
                  label: "Emotes",
                  count: emotes?.length || 0,
                  icon: Smile,
                },
                {
                  id: "wallpapers",
                  label: "Wallpapers",
                  count: wallpapers?.length || 0,
                  icon: Monitor,
                },
                {
                  id: "emojicombos",
                  label: "Emoji Combos",
                  count: emojicombos?.length || 0,
                  icon: BsFillEmojiHeartEyesFill,
                },
                {
                  id: "favorites",
                  label: "Favorites",
                  count: favorites?.length ?? 0,
                  icon: Heart,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                  <span
                    className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-700/50 text-slate-400"
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
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {getPaginatedData(profilePairs).map((pair) => (
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
                    <Pagination
                      totalPages={getTotalPages(profilePairs)}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </div>
            )}

            {/* PFPs Tab */}
            {activeTab === "pfps" && (
              <div>
                {pfps.length === 0 ? (
                  <div className="text-center py-16">
                    <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No PFPs yet
                    </h3>
                    <p className="text-gray-400">
                      {isOwnProfile
                        ? "You haven't uploaded any profile pictures yet."
                        : "This user hasn't uploaded any profile pictures yet."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                      {getPaginatedData(pfps).map((upload) => (
                        <motion.div
                          key={upload.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.05 }}
                          className="group bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-slate-800/80 transition-all cursor-pointer border border-slate-700/50 hover:border-slate-600 shadow-lg hover:shadow-purple-500/10"
                          onClick={() => openPreview(upload as UserUpload)}
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={upload.image_url || "/placeholder.svg"}
                              alt={upload.title || "PFP"}
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
                        </motion.div>
                      ))}
                    </div>
                    <Pagination
                      totalPages={getTotalPages(pfps)}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </div>
            )}

            {/* Banners Tab */}
            {activeTab === "banners" && (
              <div>
                {banners.length === 0 ? (
                  <div className="text-center py-16">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No banners yet
                    </h3>
                    <p className="text-gray-400">
                      {isOwnProfile
                        ? "You haven't uploaded any banners yet."
                        : "This user hasn't uploaded any banners yet."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                      {getPaginatedData(banners).map((upload) => (
                        <motion.div
                          key={upload.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.05 }}
                          className="group bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-slate-800/80 transition-all cursor-pointer border border-slate-700/50 hover:border-slate-600 shadow-lg hover:shadow-purple-500/10"
                          onClick={() => openPreview(upload as UserUpload)}
                        >
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={upload.image_url || "/placeholder.svg"}
                              alt={upload.title || "Banner"}
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
                        </motion.div>
                      ))}
                    </div>
                    <Pagination
                      totalPages={getTotalPages(banners)}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </div>
            )}

            {/* Emotes Tab */}
            {activeTab === "emotes" && (
              <div>
                {emotes?.length === 0 ? (
                  <div className="text-center py-16">
                    <Smile className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No emotes yet
                    </h3>
                    <p className="text-gray-400">
                      {isOwnProfile
                        ? "You haven't uploaded any emotes yet."
                        : "This user hasn't uploaded any emotes yet."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                      {getPaginatedData(emotes).map((emote) => (
                        <motion.div
                          key={emote.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.05 }}
                          className="group bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-slate-800/80 transition-all cursor-pointer border border-slate-700/50 hover:border-slate-600 shadow-lg hover:shadow-purple-500/10"
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={emote.image_url || "/placeholder.svg"}
                              alt={emote.title || "Emote"}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-2 sm:p-4">
                            <h3 className="font-semibold text-white mb-1 truncate text-sm sm:text-base">
                              {emote.title || "Untitled"}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400 mb-2">
                              {emote.category || "No category"}
                            </p>
                            {emote.tags && emote.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {emote.tags.slice(0, 2).map((tag, i) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {emote.tags.length > 2 && (
                                  <span className="text-xs text-gray-400">
                                    +{emote.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <Pagination
                      totalPages={getTotalPages(emotes)}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </div>
            )}

            {/* Wallpapers Tab */}
            {activeTab === "wallpapers" && (
              <div>
                {wallpapers?.length === 0 ? (
                  <div className="text-center py-16">
                    <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No wallpapers yet
                    </h3>
                    <p className="text-gray-400">
                      {isOwnProfile
                        ? "You haven't uploaded any wallpapers yet."
                        : "This user hasn't uploaded any wallpapers yet."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                      {getPaginatedData(wallpapers).map((wallpaper) => (
                        <motion.div
                          key={wallpaper.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.05 }}
                          className="group bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-slate-800/80 transition-all cursor-pointer border border-slate-700/50 hover:border-slate-600 shadow-lg hover:shadow-purple-500/10"
                        >
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={wallpaper.image_url || "/placeholder.svg"}
                              alt={wallpaper.title || "Wallpaper"}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-2 sm:p-4">
                            <h3 className="font-semibold text-white mb-1 truncate text-sm sm:text-base">
                              {wallpaper.title || "Untitled"}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400 mb-2">
                              {wallpaper.category || "No category"}
                              {wallpaper.resolution && ` • ${wallpaper.resolution}`}
                            </p>
                            {wallpaper.tags && wallpaper.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {wallpaper.tags.slice(0, 2).map((tag, i) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {wallpaper.tags.length > 2 && (
                                  <span className="text-xs text-gray-400">
                                    +{wallpaper.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <Pagination
                      totalPages={getTotalPages(wallpapers)}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
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
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                      {getPaginatedData(favorites).map((fav) => {
                        // Determine which content type this favorite is
                        const content = fav?.upload || fav?.emote || fav?.wallpaper || fav?.emoji_combo
                        const contentType = fav?.upload ? 'profile' : fav?.emote ? 'emote' : fav?.wallpaper ? 'wallpaper' : fav?.emoji_combo ? 'emoji_combo' : null
                        
                        if (!content) return null

                        // For emoji combos, show text preview instead of image
                        if (contentType === 'emoji_combo') {
                          const combo = fav.emoji_combo
                          return (
                            <div
                              key={fav.id}
                              className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer hover:scale-105"
                            >
                              <div className="aspect-square overflow-hidden relative bg-slate-800/50 p-4 flex items-center justify-center">
                                <div className="text-2xl sm:text-3xl text-center break-words">
                                  {combo?.combo_text || "Untitled"}
                                </div>
                                <div className="absolute top-2 right-2">
                                  <Heart className="h-5 w-5 text-red-500 fill-current" />
                                </div>
                              </div>
                              <div className="p-2 sm:p-4">
                                <h3 className="font-semibold text-white mb-1 truncate text-sm sm:text-base">
                                  {combo?.name || "Untitled"}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-400">
                                  Emoji Combo
                                </p>
                              </div>
                            </div>
                          )
                        }

                        // For profiles, emotes, and wallpapers, show image
                        const imageUrl = 'image_url' in content ? content.image_url : "/placeholder.svg"
                        const title = 'title' in content ? content.title : ('name' in content ? content.name : "Untitled")
                        const category = 'category' in content ? content.category : contentType || "No category"
                        
                        return (
                          <div
                            key={fav.id}
                            className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer hover:scale-105"
                            onClick={() => {
                              if (contentType === 'profile' && fav?.upload) {
                                openPreview(fav.upload as UserUpload)
                              }
                            }}
                          >
                            <div className="aspect-square overflow-hidden relative">
                              <img
                                src={imageUrl}
                                alt={title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute top-2 right-2">
                                <Heart className="h-5 w-5 text-red-500 fill-current" />
                              </div>
                            </div>
                            <div className="p-2 sm:p-4">
                              <h3 className="font-semibold text-white mb-1 truncate text-sm sm:text-base">
                                {title}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-400">
                                {category}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Pagination
                      totalPages={getTotalPages(favorites)}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </div>
            )}

            {/* Emoji Combos Tab */}
            {activeTab === "emojicombos" && (
              <div>
                {emojicombos?.length === 0 ? (
                  <div className="text-center py-16">
                    <BsFillEmojiHeartEyesFill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No emoji combos yet
                    </h3>
                    <p className="text-gray-400">
                      {isOwnProfile
                        ? "You haven't created any emoji combos yet."
                        : "This user hasn't created any emoji combos yet."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div 
                      className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6"
                      style={{ columnGap: '1.5rem' }}
                    >
                      {getPaginatedData(emojicombos).map((combo) => {
                      const isAscii = combo.combo_text && (
                        combo.combo_text.includes("\n") ||
                        /[│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬▀▄█▌▐░▒▓■□▪▫◆◇○●◦‣⁃]/.test(combo.combo_text) ||
                        /(.)\1{4,}/.test(combo.combo_text)
                      );
                      const contentLength = combo.combo_text?.length || 0;
                      
                      const cardStyles = isAscii
                        ? {
                            fontSize:
                              contentLength > 2000
                                ? "8px"
                                : contentLength > 1000
                                  ? "10px"
                                  : contentLength > 500
                                    ? "12px"
                                    : contentLength > 200
                                      ? "14px"
                                      : "16px",
                            lineHeight: "1.0",
                            padding: "12px",
                          }
                        : {
                            minHeight: contentLength > 50 ? "80px" : "60px",
                            fontSize: contentLength > 100 ? "2rem" : contentLength > 50 ? "2.5rem" : "3rem",
                            lineHeight: "1.1",
                            padding: "16px",
                          };

                      return (
                        <motion.div
                          key={combo.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          className="group bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-slate-800/80 transition-all border border-slate-700/50 hover:border-slate-600 shadow-lg hover:shadow-purple-500/10 mb-4 sm:mb-6 break-inside-avoid"
                          style={{ pageBreakInside: 'avoid' }}
                        >
                          {/* Content Preview Area */}
                          <div
                            className="relative cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-200"
                            style={{ padding: cardStyles.padding }}
                          >
                            <div
                              className={`w-full flex ${isAscii ? "items-start justify-start" : "items-center justify-center"}`}
                              style={{
                                fontFamily: isAscii ? "'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace" : "inherit",
                                fontSize: cardStyles.fontSize,
                                whiteSpace: isAscii ? "pre" : "normal",
                                lineHeight: cardStyles.lineHeight,
                                color: "white",
                                letterSpacing: isAscii ? "-0.5px" : "0",
                                fontWeight: isAscii ? "400" : "500",
                                textAlign: isAscii ? "left" : "center",
                                wordBreak: "normal",
                                overflowWrap: "normal",
                                width: "100%",
                                minHeight: isAscii ? "auto" : cardStyles.minHeight,
                              }}
                            >
                              <div
                                className={`${isAscii ? "w-full" : ""}`}
                                style={{
                                  maxWidth: "100%",
                                  whiteSpace: isAscii ? "pre" : "normal",
                                }}
                              >
                                {combo.combo_text || ""}
                              </div>
                            </div>
                          </div>

                          {/* Info Section */}
                          <div className="p-3 sm:p-4 bg-slate-900/30">
                            <h3 className="font-semibold text-white mb-2 truncate text-sm sm:text-base">
                              {combo.name || "Untitled"}
                            </h3>
                            
                            {combo.description && (
                              <p className="text-xs sm:text-sm text-gray-400 mb-2 line-clamp-2">
                                {combo.description}
                              </p>
                            )}

                            {combo.tags && combo.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {combo.tags.slice(0, 3).map((tag, i) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-purple-500/20 text-purple-300 px-1.5 sm:px-2 py-0.5 rounded-full"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {combo.tags.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{combo.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2 mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (combo.combo_text) {
                                    navigator.clipboard.writeText(combo.combo_text);
                                  }
                                }}
                                className="p-1.5 sm:p-2 bg-green-600/80 hover:bg-green-600 rounded-lg text-white transition-colors"
                                title="Copy"
                                type="button"
                              >
                                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                      })}
                    </div>
                    <Pagination
                      totalPages={getTotalPages(emojicombos)}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
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


        {/* Followers/Following Modal */}
        <Transition appear show={showFollowModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowFollowModal(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 shadow-xl">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                          {followModalType === "followers" ? (
                            <>
                              <Users className="h-5 w-5 text-purple-400" />
                              Followers
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-5 w-5 text-purple-400" />
                              Following
                            </>
                          )}
                        </Dialog.Title>
                        <button
                          onClick={() => setShowFollowModal(false)}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {loadingFollowList ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                      ) : followList.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                          <p className="text-slate-400">
                            No {followModalType === "followers" ? "followers" : "following"} yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {followList.map((item) => (
                            item.user && (
                              <Link
                                key={item.user.user_id}
                                to={`/user/${item.user.username}`}
                                onClick={() => setShowFollowModal(false)}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors group"
                              >
                                <img
                                  src={item.user.avatar_url || "/placeholder.svg"}
                                  alt={item.user.display_name || item.user.username}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-600 group-hover:border-purple-500 transition-colors"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white truncate">
                                    {item.user.display_name || item.user.username}
                                  </p>
                                  <p className="text-sm text-slate-400 truncate">
                                    @{item.user.username}
                                  </p>
                                </div>
                              </Link>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
      <Footer />
    </>
  );
}
