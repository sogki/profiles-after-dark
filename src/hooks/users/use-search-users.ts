import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

type UserListOptions = {
  searchQuery?: string;
};

export default function useUserList({ searchQuery }: UserListOptions = {}) {
  const queryData = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, username, avatar_url, banner_url, bio")
        .order("username", { ascending: true });

      if (error) throw new Error(error.message);

      if (searchQuery) {
        return data.filter(
          (user) =>
            user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.bio &&
              user.bio.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      return data;
    },
  });

  return queryData;
}
