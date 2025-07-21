import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export default function useRealtimeFooterStats() {
  const queryClient = useQueryClient();

  const fetchStats = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["footer-stats"],
    });
  };

  useEffect(() => {
    // Set up real-time subscriptions for live updates
    const membersSubscription = supabase
      .channel("members-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_profiles" },
        () => fetchStats()
      )
      .subscribe();

    const pfpsSubscription = supabase
      .channel("pfps-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pfps" },
        () => fetchStats()
      )
      .subscribe();

    const bannersSubscription = supabase
      .channel("banners-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banners" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      membersSubscription.unsubscribe();
      pfpsSubscription.unsubscribe();
      bannersSubscription.unsubscribe();
    };
  }, []);
}
