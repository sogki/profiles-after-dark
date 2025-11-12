import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import useRetrieveUserProfile from "./use-retrieve-user-profile";

export default function useRetrieveProfileEmotes() {
  const { username } = useParams<{ username: string }>();

  const { data: profileData } = useRetrieveUserProfile();

  const userProfileEmotesQueryData = useQuery({
    queryKey: ["user-profile/emotes", { username }],
    queryFn: async () => {
      const { data: emotesData, error: emotesError } = await supabase
        .from("emotes")
        .select("id, title, image_url, tags, category, created_at")
        .eq("user_id", profileData?.user_id ?? "")
        .order("created_at", { ascending: false });

      if (emotesError) {
        console.error("Error fetching emotes:", emotesError);
        throw emotesError;
      }
      return emotesData;
    },
    enabled: !!username && !!profileData?.user_id,
  });

  return userProfileEmotesQueryData;
}

