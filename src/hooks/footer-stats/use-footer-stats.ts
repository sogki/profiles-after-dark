import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export default function useFooterStats() {
  const footerStatsQuery = useQuery({
    queryKey: ["footer-stats"],
    queryFn: async () => {
      const [memberCount, pfpCount, bannerCount, pairsCount] =
        await Promise.all([
          supabase
            .from("user_profiles")
            .select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase
            .from("emoji_combos")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("profile_pairs")
            .select("*", { count: "exact", head: true }),
        ]);

      return {
        members: memberCount?.count || 0,
        assets:
          (pfpCount?.count || 0) +
          (bannerCount?.count || 0) +
          (pairsCount?.count || 0),
      };
    },
  });

  return footerStatsQuery;
}
