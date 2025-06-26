import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type EmojiCombo = Database['public']['Tables']['emoji_combos']['Row'];

export function useEmojiCombos() {
  const [emojiCombos, setEmojiCombos] = useState<EmojiCombo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmojiCombos() {
      setLoading(true);
      const { data, error } = await supabase
        .from('emoji_combos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching emoji combos:', error);
        setError(error.message);
      } else {
        setEmojiCombos(data);
      }

      setLoading(false);
    }

    fetchEmojiCombos();
  }, []);

  return { emojiCombos, loading, error };
}
