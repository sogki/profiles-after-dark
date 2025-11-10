import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  TrendingUp,
  UserPlus,
  Clock,
  Heart,
  Upload,
  Search,
  Filter,
  Sparkles,
  Activity,
  Star,
  Zap,
  Download,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import { supabase } from "../../lib/supabase";
import { useFollows } from "../../hooks/useFollows";
import Footer from "../Footer";

interface User {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  created_at?: string;
  upload_count?: number;
  follower_count?: number;
  is_following?: boolean;
}

interface ActivityItem {
  id: string;
  type: "upload" | "follow" | "favorite" | "download" | "profile_pair" | "emoji_combo";
  user_id: string;
  username?: string;
  avatar_url?: string;
  content_title?: string;
  content_id?: string;
  content_type?: string;
  target_user_id?: string;
  target_username?: string;
  created_at: string;
  url?: string;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "trending" | "new" | "following">("all");
  const [activeTab, setActiveTab] = useState<"members" | "activity">("members");
  const [activityFilter, setActivityFilter] = useState<"all" | "upload" | "follow" | "favorite" | "download">("all");
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivity, setHasMoreActivity] = useState(true);
  const ACTIVITY_PER_PAGE = 20;

  // Fetch community members
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First, fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*")
        .not("username", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (profilesError) {
        console.error("Error fetching user profiles:", profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Fetch upload counts and follower counts separately
      const userIds = profilesData.map((p) => p.user_id).filter(Boolean);
      
      if (userIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const [uploadsResult, followersResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id")
          .in("user_id", userIds),
        supabase
          .from("follows")
          .select("following_id")
          .in("following_id", userIds),
      ]);

      // Handle errors gracefully
      if (uploadsResult.error) {
        console.warn("Error fetching uploads:", uploadsResult.error);
      }
      if (followersResult.error) {
        console.warn("Error fetching followers:", followersResult.error);
      }

      // Count uploads per user
      const uploadCounts: Record<string, number> = {};
      if (uploadsResult.data) {
        uploadsResult.data.forEach((item: any) => {
          if (item.user_id) {
            uploadCounts[item.user_id] = (uploadCounts[item.user_id] || 0) + 1;
          }
        });
      }

      // Count followers per user
      const followerCounts: Record<string, number> = {};
      if (followersResult.data) {
        followersResult.data.forEach((item: any) => {
          if (item.following_id) {
            followerCounts[item.following_id] = (followerCounts[item.following_id] || 0) + 1;
          }
        });
      }

      // Process users with counts
      const processedUsers: User[] = profilesData.map((u: any) => ({
        id: u.id,
        user_id: u.user_id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        banner_url: u.banner_url,
        bio: u.bio,
        created_at: u.created_at,
        upload_count: uploadCounts[u.user_id] || 0,
        follower_count: followerCounts[u.user_id] || 0,
      }));

      setUsers(processedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent activity
  const fetchActivity = async () => {
    try {
      // Fetch all activity types without joins (more reliable)
      const [profilesResult, pairsResult, followsResult, favoritesResult, downloadsResult] = await Promise.all([
        // Profile uploads
        supabase
          .from("profiles")
          .select("id, title, user_id, type, created_at")
          .order("created_at", { ascending: false })
          .limit(15),
        // Profile pairs uploads
        supabase
          .from("profile_pairs")
          .select("id, title, user_id, created_at")
          .order("created_at", { ascending: false })
          .limit(15),
        // Follows
        supabase
          .from("follows")
          .select("id, follower_id, following_id, created_at")
          .order("created_at", { ascending: false })
          .limit(15),
        // Favorites
        supabase
          .from("favorites")
          .select("id, profile_id, user_id, created_at")
          .order("created_at", { ascending: false })
          .limit(15),
        // Downloads
        supabase
          .from("downloads")
          .select("id, profile_id, user_id, downloaded_at")
          .order("downloaded_at", { ascending: false })
          .limit(15),
      ]);

      const activities: ActivityItem[] = [];

      // Process profile uploads
      if (profilesResult.data && profilesResult.data.length > 0) {
        // Fetch user profiles separately
        const userIds = [...new Set(profilesResult.data.map((item: any) => item.user_id).filter(Boolean))];
        let userProfilesMap: Record<string, { username?: string; avatar_url?: string }> = {};
        
        if (userIds.length > 0) {
          const { data: userData } = await supabase
            .from("user_profiles")
            .select("user_id, username, avatar_url")
            .in("user_id", userIds);
          
          if (userData) {
            userProfilesMap = userData.reduce((acc: any, profile: any) => {
              acc[profile.user_id] = { username: profile.username, avatar_url: profile.avatar_url };
              return acc;
            }, {});
          }
        }
        
        profilesResult.data.forEach((item: any) => {
          const userProfile = userProfilesMap[item.user_id] || {};
          activities.push({
            id: `upload-profile-${item.id}`,
            type: "upload",
            user_id: item.user_id,
            username: userProfile.username,
            avatar_url: userProfile.avatar_url,
            content_title: item.title,
            content_id: item.id,
            content_type: item.type || "profile",
            created_at: item.created_at,
            url: `/gallery/${item.type === "profile" ? "pfps" : item.type === "banner" ? "banners" : "profiles"}`,
          });
        });
      }

      // Process profile pair uploads
      if (pairsResult.data && pairsResult.data.length > 0) {
        const userIds = [...new Set(pairsResult.data.map((item: any) => item.user_id).filter(Boolean))];
        let userProfilesMap: Record<string, { username?: string; avatar_url?: string }> = {};
        
        if (userIds.length > 0) {
          const { data: userData } = await supabase
            .from("user_profiles")
            .select("user_id, username, avatar_url")
            .in("user_id", userIds);
          
          if (userData) {
            userProfilesMap = userData.reduce((acc: any, profile: any) => {
              acc[profile.user_id] = { username: profile.username, avatar_url: profile.avatar_url };
              return acc;
            }, {});
          }
        }
        
        pairsResult.data.forEach((item: any) => {
          const userProfile = userProfilesMap[item.user_id] || {};
          activities.push({
            id: `upload-pair-${item.id}`,
            type: "profile_pair",
            user_id: item.user_id,
            username: userProfile.username,
            avatar_url: userProfile.avatar_url,
            content_title: item.title || "Profile Combo",
            content_id: item.id,
            content_type: "pair",
            created_at: item.created_at,
            url: `/gallery/profiles`,
          });
        });
      }

      // Process follows
      if (followsResult.data && followsResult.data.length > 0) {
        const userIds = [...new Set([
          ...followsResult.data.map((item: any) => item.follower_id),
          ...followsResult.data.map((item: any) => item.following_id),
        ].filter(Boolean))];
        let userProfilesMap: Record<string, { username?: string; avatar_url?: string }> = {};
        
        if (userIds.length > 0) {
          const { data: userData } = await supabase
            .from("user_profiles")
            .select("user_id, username, avatar_url")
            .in("user_id", userIds);
          
          if (userData) {
            userProfilesMap = userData.reduce((acc: any, profile: any) => {
              acc[profile.user_id] = { username: profile.username, avatar_url: profile.avatar_url };
              return acc;
            }, {});
          }
        }
        
        followsResult.data.forEach((item: any) => {
          const follower = userProfilesMap[item.follower_id] || {};
          const following = userProfilesMap[item.following_id] || {};
          activities.push({
            id: `follow-${item.id}`,
            type: "follow",
            user_id: item.follower_id,
            username: follower.username,
            avatar_url: follower.avatar_url,
            target_user_id: item.following_id,
            target_username: following.username,
            content_id: item.following_id,
            created_at: item.created_at,
            url: following.username ? `/user/${following.username}` : undefined,
          });
        });
      }

      // Process favorites
      if (favoritesResult.data && favoritesResult.data.length > 0) {
        const userIds = [...new Set(favoritesResult.data.map((item: any) => item.user_id).filter(Boolean))];
        const profileIds = [...new Set(favoritesResult.data.map((item: any) => item.profile_id).filter(Boolean))];
        let userProfilesMap: Record<string, { username?: string; avatar_url?: string }> = {};
        let profilesMap: Record<string, { title?: string; type?: string }> = {};
        
        if (userIds.length > 0) {
          const { data: userData } = await supabase
            .from("user_profiles")
            .select("user_id, username, avatar_url")
            .in("user_id", userIds);
          
          if (userData) {
            userProfilesMap = userData.reduce((acc: any, profile: any) => {
              acc[profile.user_id] = { username: profile.username, avatar_url: profile.avatar_url };
              return acc;
            }, {});
          }
        }
        
        if (profileIds.length > 0) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, title, type")
            .in("id", profileIds);
          
          if (profileData) {
            profilesMap = profileData.reduce((acc: any, profile: any) => {
              acc[profile.id] = { title: profile.title, type: profile.type };
              return acc;
            }, {});
          }
        }
        
        favoritesResult.data.forEach((item: any) => {
          const userProfile = userProfilesMap[item.user_id] || {};
          const profile = profilesMap[item.profile_id] || {};
          activities.push({
            id: `favorite-${item.id}`,
            type: "favorite",
            user_id: item.user_id,
            username: userProfile.username,
            avatar_url: userProfile.avatar_url,
            content_title: profile.title,
            content_id: item.profile_id,
            content_type: profile.type || "profile",
            created_at: item.created_at,
            url: `/gallery/${profile.type === "profile" ? "pfps" : profile.type === "banner" ? "banners" : "profiles"}`,
          });
        });
      }

      // Process downloads
      if (downloadsResult.data && downloadsResult.data.length > 0) {
        const userIds = [...new Set(downloadsResult.data.map((item: any) => item.user_id).filter(Boolean))];
        const profileIds = [...new Set(downloadsResult.data.map((item: any) => item.profile_id).filter(Boolean))];
        let userProfilesMap: Record<string, { username?: string; avatar_url?: string }> = {};
        let profilesMap: Record<string, { title?: string; type?: string }> = {};
        
        if (userIds.length > 0) {
          const { data: userData } = await supabase
            .from("user_profiles")
            .select("user_id, username, avatar_url")
            .in("user_id", userIds);
          
          if (userData) {
            userProfilesMap = userData.reduce((acc: any, profile: any) => {
              acc[profile.user_id] = { username: profile.username, avatar_url: profile.avatar_url };
              return acc;
            }, {});
          }
        }
        
        if (profileIds.length > 0) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, title, type")
            .in("id", profileIds);
          
          if (profileData) {
            profilesMap = profileData.reduce((acc: any, profile: any) => {
              acc[profile.id] = { title: profile.title, type: profile.type };
              return acc;
            }, {});
          }
        }
        
        downloadsResult.data.forEach((item: any) => {
          const userProfile = item.user_id ? (userProfilesMap[item.user_id] || {}) : {};
          const profile = profilesMap[item.profile_id] || {};
          activities.push({
            id: `download-${item.id}`,
            type: "download",
            user_id: item.user_id || "anonymous",
            username: userProfile.username || "Anonymous",
            avatar_url: userProfile.avatar_url,
            content_title: profile.title,
            content_id: item.profile_id,
            content_type: profile.type || "profile",
            created_at: item.downloaded_at || item.created_at,
            url: `/gallery/${profile.type === "profile" ? "pfps" : profile.type === "banner" ? "banners" : "profiles"}`,
          });
        });
      }

      // Sort by date
      activities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Set all activities (pagination will be handled in display)
      setActivity(activities);
    } catch (error) {
      console.error("Error fetching activity:", error);
      setActivity([]);
    }
  };

  // Setup real-time subscriptions for activity feed
  useEffect(() => {
    if (activeTab !== "activity") return;

    const channels: any[] = [];

    // Subscribe to new profiles
    const profilesChannel = supabase
      .channel("activity-profiles")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          // Fetch user profile for the new upload
          supabase
            .from("user_profiles")
            .select("username, avatar_url")
            .eq("user_id", payload.new.user_id)
            .single()
            .then(({ data: userData }) => {
              const newActivity: ActivityItem = {
                id: `upload-profile-${payload.new.id}`,
                type: "upload",
                user_id: payload.new.user_id,
                username: userData?.username,
                avatar_url: userData?.avatar_url,
                content_title: payload.new.title,
                content_id: payload.new.id,
                content_type: payload.new.type || "profile",
                created_at: payload.new.created_at || new Date().toISOString(),
                url: `/gallery/${payload.new.type === "profile" ? "pfps" : payload.new.type === "banner" ? "banners" : "profiles"}`,
              };
              setActivity((prev) => [newActivity, ...prev].slice(0, 50));
            });
        }
      )
      .subscribe();

    channels.push(profilesChannel);

    // Subscribe to new follows
    const followsChannel = supabase
      .channel("activity-follows")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "follows",
        },
        (payload) => {
          // Fetch follower and following user profiles
          Promise.all([
            supabase
              .from("user_profiles")
              .select("username, avatar_url")
              .eq("user_id", payload.new.follower_id)
              .single(),
            supabase
              .from("user_profiles")
              .select("username")
              .eq("user_id", payload.new.following_id)
              .single(),
          ]).then(([follower, following]) => {
            const newActivity: ActivityItem = {
              id: `follow-${payload.new.id}`,
              type: "follow",
              user_id: payload.new.follower_id,
              username: follower.data?.username,
              avatar_url: follower.data?.avatar_url,
              target_user_id: payload.new.following_id,
              target_username: following.data?.username,
              content_id: payload.new.following_id,
              created_at: payload.new.created_at || new Date().toISOString(),
              url: following.data?.username ? `/user/${following.data.username}` : undefined,
            };
            setActivity((prev) => [newActivity, ...prev].slice(0, 50));
          });
        }
      )
      .subscribe();

    channels.push(followsChannel);

    // Subscribe to new favorites
    const favoritesChannel = supabase
      .channel("activity-favorites")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "favorites",
        },
        (payload) => {
          // Fetch user and profile data
          Promise.all([
            supabase
              .from("user_profiles")
              .select("username, avatar_url")
              .eq("user_id", payload.new.user_id)
              .single(),
            supabase
              .from("profiles")
              .select("title, type")
              .eq("id", payload.new.profile_id)
              .single(),
          ]).then(([user, profile]) => {
            const newActivity: ActivityItem = {
              id: `favorite-${payload.new.id}`,
              type: "favorite",
              user_id: payload.new.user_id,
              username: user.data?.username,
              avatar_url: user.data?.avatar_url,
              content_title: profile.data?.title,
              content_id: payload.new.profile_id,
              content_type: profile.data?.type || "profile",
              created_at: payload.new.created_at || new Date().toISOString(),
              url: `/gallery/${profile.data?.type === "profile" ? "pfps" : profile.data?.type === "banner" ? "banners" : "profiles"}`,
            };
            setActivity((prev) => [newActivity, ...prev].slice(0, 50));
          });
        }
      )
      .subscribe();

    channels.push(favoritesChannel);

    // Cleanup subscriptions
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
    fetchActivity();
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((u) =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (filter) {
      case "trending":
        filtered = [...filtered].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
        break;
      case "new":
        filtered = [...filtered].sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        break;
      case "following":
        // Filter to only show users you follow
        // This would need to be implemented with the useFollows hook
        break;
      default:
        break;
    }

    return filtered;
  }, [users, searchQuery, filter]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "upload":
      case "profile_pair":
        return <Upload className="h-4 w-4 text-blue-400" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-400" />;
      case "favorite":
        return <Heart className="h-4 w-4 text-red-400" />;
      case "download":
        return <Download className="h-4 w-4 text-purple-400" />;
      default:
        return <Activity className="h-4 w-4 text-purple-400" />;
    }
  };

  const getActivityText = (item: ActivityItem) => {
    switch (item.type) {
      case "upload":
        return `uploaded ${item.content_title || "new content"}`;
      case "profile_pair":
        return `uploaded profile combo: ${item.content_title || "Untitled"}`;
      case "follow":
        return item.target_username 
          ? `started following @${item.target_username}`
          : "started following someone";
      case "favorite":
        return `favorited ${item.content_title || "content"}`;
      case "download":
        return `downloaded ${item.content_title || "content"}`;
      default:
        return "did something";
    }
  };

  const getActivityUrl = (item: ActivityItem): string => {
    if (item.url) return item.url;
    
    switch (item.type) {
      case "follow":
        return item.target_username ? `/user/${item.target_username}` : "#";
      case "upload":
      case "profile_pair":
      case "favorite":
      case "download":
        return item.content_id 
          ? `/gallery/${item.content_type === "profile" ? "pfps" : item.content_type === "banner" ? "banners" : "profiles"}`
          : "#";
      default:
        return "#";
    }
  };

  const filteredActivity = useMemo(() => {
    let filtered = activity;
    if (activityFilter !== "all") {
      filtered = activity.filter((item) => {
        if (activityFilter === "upload") {
          return item.type === "upload" || item.type === "profile_pair";
        }
        return item.type === activityFilter;
      });
    }
    return filtered;
  }, [activity, activityFilter]);

  // Group activity by date
  const groupedActivity = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    filteredActivity.forEach((item) => {
      const itemDate = new Date(item.created_at);
      let groupKey: string;

      if (itemDate >= today) {
        groupKey = "Today";
      } else if (itemDate >= yesterday) {
        groupKey = "Yesterday";
      } else if (itemDate >= thisWeek) {
        groupKey = "This Week";
      } else {
        const month = itemDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        groupKey = month;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [filteredActivity]);

  // Paginated activity items
  const displayedActivity = useMemo(() => {
    const allItems = Object.entries(groupedActivity).flatMap(([_, items]) => items);
    const paginated = allItems.slice(0, ACTIVITY_PER_PAGE * activityPage);
    setHasMoreActivity(paginated.length < allItems.length);
    return paginated;
  }, [groupedActivity, activityPage]);

  const loadMoreActivity = () => {
    setActivityPage((prev) => prev + 1);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl">
              <Users className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-white text-4xl font-bold">Community</h1>
              <p className="text-gray-400 text-lg">Connect with creators and discover new content</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "members"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Users className="inline h-4 w-4 mr-2" />
              Members
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "activity"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Activity className="inline h-4 w-4 mr-2" />
              Activity Feed
            </button>
          </div>

          {/* Search and Filters */}
          {activeTab === "members" && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2">
                {["all", "trending", "new", "following"].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === filterOption
                        ? "bg-purple-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : activeTab === "members" ? (
          filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">No members found</h3>
              <p className="text-slate-400">
                {searchQuery
                  ? "No members match your search criteria."
                  : "No members available at the moment."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((userItem) => (
              <Link
                key={userItem.id}
                to={`/user/${userItem.username}`}
                className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 block"
              >
                {/* Banner */}
                <div className="relative h-32">
                  {userItem.banner_url ? (
                    <img
                      src={userItem.banner_url}
                      alt={`${userItem.username}'s banner`}
                      className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      <div className="text-white/30 text-2xl font-medium">
                        {userItem.username?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
                  <img
                    src={userItem.avatar_url || "/placeholder.svg"}
                    alt={`${userItem.username}'s avatar`}
                    className="w-20 h-20 rounded-full border-4 border-purple-500 bg-slate-900 object-cover shadow-lg"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div className="pt-12 pb-6 px-6 text-center">
                  <h2 className="text-white font-semibold text-lg mb-1 truncate group-hover:text-purple-300 transition-colors">
                    @{userItem.username}
                  </h2>
                  {userItem.display_name && (
                    <p className="text-slate-400 text-sm mb-2">{userItem.display_name}</p>
                  )}
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 min-h-[2.5rem] mb-4">
                    {userItem.bio || "No bio available"}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      <span>{userItem.upload_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{userItem.follower_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Link>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {/* Activity Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter:
              </span>
              {(["all", "upload", "follow", "favorite", "download"] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setActivityFilter(filterType)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activityFilter === filterType
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {filterType === "all" ? "All" : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>

            {displayedActivity.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">
                  {activity.length === 0 ? "No recent activity" : `No ${activityFilter === "all" ? "" : activityFilter} activity found`}
                </p>
              </div>
            ) : (
              <>
                {Object.entries(groupedActivity).map(([groupKey, items]) => {
                  const groupItems = items.filter((item) => displayedActivity.includes(item));
                  if (groupItems.length === 0) return null;

                  return (
                    <div key={groupKey} className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-400 mb-3 px-2 flex items-center gap-2">
                        <div className="h-px flex-1 bg-slate-700"></div>
                        <span>{groupKey}</span>
                        <div className="h-px flex-1 bg-slate-700"></div>
                      </h3>
                      <div className="space-y-3">
                        {groupItems.map((item) => {
                const activityUrl = getActivityUrl(item);
                const isClickable = activityUrl !== "#";
                
                const ActivityContent = (
                  <div className="flex items-center gap-4">
                    <Link
                      to={`/user/${item.username || "unknown"}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0"
                    >
                      <img
                        src={item.avatar_url || "/placeholder.svg"}
                        alt={item.username || "User"}
                        className="w-12 h-12 rounded-full object-cover hover:ring-2 hover:ring-purple-500 transition-all"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActivityIcon(item.type)}
                        <Link
                          to={`/user/${item.username || "unknown"}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-white hover:text-purple-400 transition-colors"
                        >
                          @{item.username || "Unknown"}
                        </Link>
                        <span className="text-slate-400">{getActivityText(item)}</span>
                        {isClickable && (
                          <LinkIcon className="h-3 w-3 text-slate-500 ml-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(item.created_at)}
                      </p>
                    </div>
                  </div>
                );

                if (isClickable) {
                  return (
                    <Link
                      key={item.id}
                      to={activityUrl}
                      className="block bg-slate-800 rounded-xl p-4 hover:bg-slate-700/50 transition-colors cursor-pointer group"
                    >
                      {ActivityContent}
                    </Link>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="bg-slate-800 rounded-xl p-4 hover:bg-slate-700/50 transition-colors"
                  >
                    {ActivityContent}
                  </div>
                );
                        })}
                      </div>
                    </div>
                  );
                })}
                {hasMoreActivity && displayedActivity.length < filteredActivity.length && (
                  <div className="text-center mt-6">
                    <button
                      onClick={loadMoreActivity}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                    >
                      Load More Activity
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

