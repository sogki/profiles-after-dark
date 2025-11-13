import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import useRetrieveUserProfile from "./use-retrieve-user-profile";

export default function useRetrieveProfileWallpapers() {
  const { username } = useParams<{ username: string }>();

  const { data: profileData } = useRetrieveUserProfile();

  const userProfileWallpapersQueryData = useQuery({
    queryKey: ["user-profile/wallpapers", { username }],
    queryFn: async () => {
      const { data: wallpapersData, error: wallpapersError } = await supabase
        .from("wallpapers")
        .select("id, title, image_url, tags, category, resolution, created_at")
        .eq("user_id", profileData?.user_id ?? "")
        .or("status.is.null,status.neq.rejected")
        .order("created_at", { ascending: false });

      if (wallpapersError) {
        console.error("Error fetching wallpapers:", wallpapersError);
        throw wallpapersError;
      }
      return wallpapersData;
    },
    enabled: !!username && !!profileData?.user_id,
  });

  return userProfileWallpapersQueryData;
}

