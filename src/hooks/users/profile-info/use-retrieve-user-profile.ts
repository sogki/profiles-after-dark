import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/authContext";

export default function useRetrieveUserProfile() {
  const { username } = useParams<{ username: string }>();

  const { user } = useAuth();

  const userQueryData = useQuery({
    queryKey: ["user-profile", { username }],
    queryFn: async () => {
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
        .eq("username", username ?? "")
        .single();

      if (profileError) {
        throw new Error(profileError.message);
      }

      return profileData;
    },
    enabled: !!username,
  });

  return {
    ...userQueryData,
    currentUser: {
      id: user?.id,
      username: user?.user_metadata?.username || "",
    },
  };
}
