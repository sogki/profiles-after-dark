import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export default function useUserList() {
  const queryData = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, username, avatar_url, banner_url, bio")
        .order("username", { ascending: true });

      if (error) throw new Error(error.message);

      return data;
    },
  });

  return queryData;
}
