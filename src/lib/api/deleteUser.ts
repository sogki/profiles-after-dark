import { supabase } from '../supabase';

export async function deleteUser(userId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return { error: 'No session found. Please sign in again.' };
  }

  try {
    const res = await fetch(`${process.env.REACT_APP_SUPABASE_FUNCTION_URL}/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId }),
    });

    const result = await res.json();

    if (!res.ok) {
      return { error: result.error || 'Unknown error' };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Failed to connect to delete-user function' };
  }
}
