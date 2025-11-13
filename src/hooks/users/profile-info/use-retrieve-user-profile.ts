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
      // First get the profile
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
        show_badges_on_profile,
        created_at
      `
        )
        .eq("username", username ?? "")
        .single();

      if (profileError) {
        throw new Error(profileError.message || "User not found");
      }

      if (!profileData) {
        throw new Error("User not found");
      }

      // Then get badges separately since there's no direct FK relationship
      // Only fetch badges if user_id exists
      if (profileData.user_id) {
        try {
          const { data: badgesData, error: badgesError } = await supabase
            .from("user_badges")
            .select(
              `
              badges (
                id,
                name,
                image_url,
                code,
                category,
                rarity
              )
            `
            )
            .eq("user_id", profileData.user_id);

          // Attach badges to profile data, sorted by category (special first) and rarity
          if (badgesData && badgesData.length > 0) {
            const sortedBadges = [...badgesData].sort((a: any, b: any) => {
              const categoryOrder: Record<string, number> = {
                'special': 0,
                'milestone': 1,
                'social': 2,
                'content': 3
              };
              const rarityOrder: Record<string, number> = {
                'legendary': 0,
                'epic': 1,
                'rare': 2,
                'uncommon': 3,
                'common': 4
              };
              
              const categoryA = categoryOrder[a.badges?.category || 'content'] ?? 99;
              const categoryB = categoryOrder[b.badges?.category || 'content'] ?? 99;
              
              if (categoryA !== categoryB) {
                return categoryA - categoryB;
              }
              
              const rarityA = rarityOrder[a.badges?.rarity || 'common'] ?? 99;
              const rarityB = rarityOrder[b.badges?.rarity || 'common'] ?? 99;
              
              return rarityA - rarityB;
            });
            
            profileData.user_badges = sortedBadges as any;
          } else {
            // No badges found, set empty array
            profileData.user_badges = [];
          }
          
          // Log error but don't fail the query
          if (badgesError) {
            console.error('Error fetching badges:', badgesError);
            // Set empty array on error so profile still loads
            profileData.user_badges = [];
          }
        } catch (badgeError) {
          // Catch any errors in badge fetching and continue
          console.error('Error fetching badges:', badgeError);
          profileData.user_badges = [];
        }
      } else {
        // No user_id, set empty badges array
        profileData.user_badges = [];
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
