import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/authContext';
import toast from 'react-hot-toast';

interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  updated_at?: string;
}

interface FollowStats {
  followers: number;
  following: number;
  isFollowing: boolean;
}

export function useFollows(targetUserId?: string) {
  const { user } = useAuth();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [stats, setStats] = useState<FollowStats>({
    followers: 0,
    following: 0,
    isFollowing: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch followers for a specific user (users who follow this user)
  const fetchFollowers = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFollowers(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching followers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch followers');
      return [];
    }
  }, []);

  // Fetch following for a specific user
  const fetchFollowing = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFollowing(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching following:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch following');
      return [];
    }
  }, []);

  // Fetch follow stats for a specific user
  const fetchFollowStats = useCallback(async (userId: string) => {
    if (!user) return;

    try {
      const [followersResult, followingResult, isFollowingResult] = await Promise.all([
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId),
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .maybeSingle(),
      ]);

      setStats({
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
        isFollowing: !!isFollowingResult.data,
      });
    } catch (err) {
      console.error('Error fetching follow stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch follow stats');
    }
  }, [user]);

  // Follow a user
  const followUser = useCallback(async (followingId: string) => {
    if (!user) {
      toast.error('Please log in to follow users');
      return false;
    }

    if (user.id === followingId) {
      toast.error('You cannot follow yourself');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('follows')
        .insert([{ follower_id: user.id, following_id: followingId }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - already following
          toast.error('You are already following this user');
          return false;
        }
        throw error;
      }

      // Update stats
      await fetchFollowStats(followingId);
      
      // Update local state
      setFollows((prev) => [...prev, data]);
      setStats((prev) => ({
        ...prev,
        followers: prev.followers + (followingId === user.id ? 0 : 1),
        isFollowing: followingId === targetUserId ? true : prev.isFollowing,
      }));

      toast.success('You are now following this user');
      return true;
    } catch (err) {
      console.error('Error following user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to follow user';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId, fetchFollowStats]);

  // Unfollow a user
  const unfollowUser = useCallback(async (followingId: string) => {
    if (!user) {
      toast.error('Please log in to unfollow users');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

      if (error) throw error;

      // Update stats
      await fetchFollowStats(followingId);
      
      // Update local state
      setFollows((prev) => prev.filter((f) => f.following_id !== followingId));
      setStats((prev) => ({
        ...prev,
        followers: prev.followers - (followingId === user.id ? 0 : 1),
        isFollowing: followingId === targetUserId ? false : prev.isFollowing,
      }));

      toast.success('You have unfollowed this user');
      return true;
    } catch (err) {
      console.error('Error unfollowing user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to unfollow user';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId, fetchFollowStats]);

  // Toggle follow/unfollow
  const toggleFollow = useCallback(async (followingId: string) => {
    if (stats.isFollowing) {
      return await unfollowUser(followingId);
    } else {
      return await followUser(followingId);
    }
  }, [stats.isFollowing, followUser, unfollowUser]);

  // Load follow stats when targetUserId changes
  useEffect(() => {
    if (targetUserId && user) {
      fetchFollowStats(targetUserId);
    }
  }, [targetUserId, user, fetchFollowStats]);

  return {
    follows,
    followers,
    following,
    stats,
    loading,
    error,
    followUser,
    unfollowUser,
    toggleFollow,
    fetchFollowers,
    fetchFollowing,
    fetchFollowStats,
  };
}

