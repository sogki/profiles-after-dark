import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import useRetrieveUserProfile from "./use-retrieve-user-profile";

export default function useRetrieveProfilePairs() {
  const { username } = useParams<{ username: string }>();

  const { data: profileData } = useRetrieveUserProfile();

  const userProfileUploadsQueryData = useQuery({
    queryKey: ["user-profile/pairs", { username }],
    queryFn: async () => {
      const { data: pairsData, error: pairsError } = await supabase
        .from("profile_pairs")
        .select(
          "id, user_id, pfp_url, banner_url, title, category, tags, created_at"
        )
        .eq("user_id", profileData?.user_id ?? "")
        .or("status.is.null,status.neq.rejected")
        .order("created_at", { ascending: false });

      if (pairsError) {
        console.error("Error fetching uploads:", pairsError);
        throw pairsError;
      }
      return pairsData;
    },
    enabled: !!username && !!profileData?.user_id,
  });

  return userProfileUploadsQueryData;
}
