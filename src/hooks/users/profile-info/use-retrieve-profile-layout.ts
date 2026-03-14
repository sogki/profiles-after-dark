import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/authContext";
import useRetrieveUserProfile from "./use-retrieve-user-profile";

export interface FlairProfileLayoutRow {
  user_id: string;
  layout_json: Record<string, unknown> | null;
  is_published: boolean;
  version: number;
  updated_at: string;
}

export default function useRetrieveProfileLayout() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { data: profileData } = useRetrieveUserProfile();

  return useQuery({
    queryKey: [
      "user-profile/layout",
      { username, profileUserId: profileData?.user_id, viewerId: user?.id },
    ],
    queryFn: async () => {
      if (!profileData?.user_id) return null;

      const isOwnProfile = user?.id === profileData.user_id;
      let query = supabase
        .from("flair_profile_layouts")
        .select("user_id, layout_json, is_published, version, updated_at")
        .eq("user_id", profileData.user_id)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!isOwnProfile) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        console.error("Error fetching profile layout:", error);
        throw error;
      }

      return (data as FlairProfileLayoutRow | null) ?? null;
    },
    enabled: !!username && !!profileData?.user_id,
  });
}
