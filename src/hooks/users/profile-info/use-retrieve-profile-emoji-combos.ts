import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import useRetrieveUserProfile from "./use-retrieve-user-profile";

export default function useRetrieveProfileEmojiCombos() {
  const { username } = useParams<{ username: string }>();

  const { data: profileData } = useRetrieveUserProfile();

  const userProfileEmojiCombosQueryData = useQuery({
    queryKey: ["user-profile/emoji-combos", { username }],
    queryFn: async () => {
      const { data: emojiCombosData, error: emojiCombosError } = await supabase
        .from("emoji_combos")
        .select("id, user_id, name, combo_text, description, tags, created_at")
        .eq("user_id", profileData?.user_id ?? "")
        .or("status.is.null,status.neq.rejected")
        .order("created_at", { ascending: false });

      if (emojiCombosError) {
        console.error("Error fetching emoji combos:", emojiCombosError);
        throw emojiCombosError;
      }
      return emojiCombosData;
    },
    enabled: !!username && !!profileData?.user_id,
  });

  return userProfileEmojiCombosQueryData;
}

