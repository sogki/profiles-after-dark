import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import useRetrieveUserProfile from "./use-retrieve-user-profile";

export default function useRetrieveProfileUploads() {
  const { username } = useParams<{ username: string }>();

  const { data: profileData } = useRetrieveUserProfile();

  const userProfileUploadsQueryData = useQuery({
    queryKey: ["user-profile/uploads", { username }],
    queryFn: async () => {
      const { data: uploadsData, error: uploadsError } = await supabase
        .from("profiles")
        .select("id, title, image_url, tags, category, type, created_at")
        .eq("user_id", profileData?.user_id ?? "")
        .or("status.is.null,status.neq.rejected")
        .order("created_at", { ascending: false });

      if (uploadsError) {
        console.error("Error fetching uploads:", uploadsError);
        throw uploadsError;
      }
      return uploadsData;
    },
    enabled: !!username && !!profileData?.user_id,
  });

  return userProfileUploadsQueryData;
}
