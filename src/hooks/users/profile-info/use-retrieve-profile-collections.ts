import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/authContext";
import useRetrieveUserProfile from "./use-retrieve-user-profile";

export interface ProfileCollection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  emote_ids: string[];
  is_public: boolean;
  is_active: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export default function useRetrieveProfileCollections() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { data: profileData } = useRetrieveUserProfile();

  const userProfileCollectionsQueryData = useQuery({
    queryKey: ["user-profile/collections", { username, profileUserId: profileData?.user_id, viewerId: user?.id }],
    queryFn: async () => {
      if (!profileData?.user_id) return [];

      const isOwnProfile = user?.id === profileData.user_id;
      let query = supabase
        .from("flair_emote_collections")
        .select("id, user_id, name, description, emote_ids, is_public, is_active, download_count, created_at, updated_at")
        .eq("user_id", profileData.user_id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (!isOwnProfile) {
        query = query.eq("is_public", true);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching profile collections:", error);
        throw error;
      }

      return (data || []) as ProfileCollection[];
    },
    enabled: !!username && !!profileData?.user_id,
  });

  return userProfileCollectionsQueryData;
}
