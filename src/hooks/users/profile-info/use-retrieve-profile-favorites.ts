import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import useRetrieveUserProfile from "./use-retrieve-user-profile";

export default function useRetrieveProfileFavorites() {
  const { username } = useParams<{ username: string }>();

  const { data: profileData } = useRetrieveUserProfile();

  const userProfileUploadsQueryData = useQuery({
    queryKey: ["user-profile/favorites", { username }],
    queryFn: async () => {
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
        .eq("user_id", profileData?.user_id ?? "")
        .order("created_at", { ascending: false });

      if (favoritesError) {
        console.error("Error fetching favorites:", favoritesError);
        throw favoritesError;
      }
      return favoritesData;
    },
    enabled: !!username && !!profileData?.user_id,
  });

  return userProfileUploadsQueryData;
}
