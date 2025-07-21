import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ModCase {
  id: number;
  guild_id: string;
  case_id: number;
  moderator_tag: string | null;
  user_tag: string | null;
  action: string;
  reason: string | null;
  timestamp: string;
}

export function useModCases(guildId: string | undefined) {
  const [cases, setCases] = useState<ModCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!guildId) {
      setCases([]);
      setLoading(false);
      return;
    }

    async function fetchCases() {
      setLoading(true);
      const { data, error } = await supabase
        .from('mod_cases')
        .select('*') 
        .eq('guild_id', guildId)
        .order('case_id', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching mod cases:', error);
        setCases([]);
      } else if (data) {
        setCases(data);
      }
      setLoading(false);
    }

    fetchCases();
  }, [guildId]);

  return { cases, loading };
}
