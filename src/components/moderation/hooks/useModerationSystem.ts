import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/authContext';
import { handleReportOrAppeal } from '../../../lib/moderationUtils';
import toast from 'react-hot-toast';

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reporter_user_id: string;
  reported_user_id?: string;
  content_id?: string;
  evidence_urls?: string[];
  created_at: string;
  updated_at: string;
  reporter?: {
    username: string;
    display_name: string;
  };
  reported_user?: {
    username: string;
    display_name: string;
  };
}

interface ModerationLog {
  id: string;
  action: string;
  moderator_id: string;
  target_user_id?: string;
  target_profile_id?: string;
  description?: string;
  created_at: string;
  moderator?: {
    username: string;
    display_name: string;
  };
  target_user?: {
    username: string;
    display_name: string;
  };
}

interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  recentActivity: any[];
  aiAccuracy: number;
  responseTime: number;
  efficiency: number;
}

export function useModerationSystem() {
  const { user, userProfile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    recentActivity: [],
    aiAccuracy: 0,
    responseTime: 0,
    efficiency: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasModerationAccess = userProfile?.role === 'admin' || userProfile?.role === 'moderator' || userProfile?.role === 'staff';

  const loadReports = useCallback(async () => {
    if (!hasModerationAccess) return;
    
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_user_id(username, display_name),
          reported_user:reported_user_id(username, display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    }
  }, [hasModerationAccess]);

  const loadLogs = useCallback(async () => {
    if (!hasModerationAccess) return;
    
    try {
      // First, get the logs without the join
      const { data: logsData, error: logsError } = await supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      // Get unique user IDs from logs
      const userIds = [...new Set([
        ...(logsData?.map(l => l.moderator_id) || []),
        ...(logsData?.map(l => l.target_user_id).filter(Boolean) || [])
      ])];
      
      // Fetch user data separately
      let usersMap: Record<string, { username: string; display_name: string }> = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name')
          .in('user_id', userIds);
        
        if (!usersError && usersData) {
          usersMap = usersData.reduce((acc, user) => {
            acc[user.user_id] = { username: user.username, display_name: user.display_name };
            return acc;
          }, {} as Record<string, { username: string; display_name: string }>);
        }
      }

      // Combine logs with user data
      const logsWithUsers = logsData?.map(log => ({
        ...log,
        moderator: usersMap[log.moderator_id] || { username: 'Unknown', display_name: 'Unknown Moderator' },
        target_user: log.target_user_id ? usersMap[log.target_user_id] : undefined
      })) || [];

      setLogs(logsWithUsers);
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  }, [hasModerationAccess]);

  const loadUsers = useCallback(async () => {
    if (!hasModerationAccess) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, [hasModerationAccess]);

  const loadRecentActivity = useCallback(async () => {
    try {
      const activities: any[] = [];

      // Get recent reports
      const { data: recentReports, error: reportsError } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          description,
          status,
          created_at,
          reporter_user_id,
          content_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!reportsError && recentReports) {
        // Get reporter information
        const reporterIds = [...new Set(recentReports.map(r => r.reporter_user_id))];
        let reportersMap: Record<string, { username: string; display_name: string }> = {};
        
        if (reporterIds.length > 0) {
          const { data: reportersData } = await supabase
            .from('user_profiles')
            .select('user_id, username, display_name')
            .in('user_id', reporterIds);
          
          if (reportersData) {
            reportersMap = reportersData.reduce((acc, user) => {
              acc[user.user_id] = { username: user.username, display_name: user.display_name };
              return acc;
            }, {} as Record<string, { username: string; display_name: string }>);
          }
        }

        // Add report activities
        recentReports.forEach(report => {
          const reporter = reportersMap[report.reporter_user_id] || { username: 'Unknown', display_name: 'Unknown User' };
          const targetInfo = report.content_id?.startsWith('user-') 
            ? `User: ${report.content_id.replace('user-', '')}`
            : report.content_id || 'General';

          activities.push({
            id: `report-${report.id}`,
            type: 'report',
            action: 'New Report',
            description: `${reporter.display_name} reported ${targetInfo} for ${report.reason}`,
            user: reporter,
            target: targetInfo,
            status: report.status,
            created_at: report.created_at,
            icon: 'Flag',
            color: report.status === 'pending' ? 'orange' : report.status === 'resolved' ? 'green' : 'blue'
          });
        });
      }

      // Get recent moderation logs (actual moderation actions, not uploads)
      const { data: recentLogs, error: logsError } = await supabase
        .from('moderation_logs')
        .select(`
          id,
          action,
          description,
          moderator_id,
          target_user_id,
          created_at
        `)
        .not('action', 'ilike', '%upload%') // Exclude upload actions
        .order('created_at', { ascending: false })
        .limit(10);

      if (!logsError && recentLogs) {
        // Get moderator and target user information
        const userIds = [...new Set([
          ...recentLogs.map(l => l.moderator_id),
          ...recentLogs.map(l => l.target_user_id).filter(Boolean)
        ])];
        
        let usersMap: Record<string, { username: string; display_name: string }> = {};
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('user_profiles')
            .select('user_id, username, display_name')
            .in('user_id', userIds);
          
          if (usersData) {
            usersMap = usersData.reduce((acc, user) => {
              acc[user.user_id] = { username: user.username, display_name: user.display_name };
              return acc;
            }, {} as Record<string, { username: string; display_name: string }>);
          }
        }

        // Add moderation log activities
        recentLogs.forEach(log => {
          const moderator = usersMap[log.moderator_id] || { username: 'Unknown', display_name: 'Unknown Moderator' };
          const target = log.target_user_id ? (usersMap[log.target_user_id] || { username: 'Unknown', display_name: 'Unknown User' }) : null;

          activities.push({
            id: `log-${log.id}`,
            type: 'moderation',
            action: log.action,
            description: log.description || `${moderator.display_name} performed ${log.action}`,
            user: moderator,
            target: target ? target.display_name : 'System',
            created_at: log.created_at,
            icon: 'Shield',
            color: 'purple'
          });
        });
      }

      // Sort by creation date and return top 10
      return activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

    } catch (error) {
      console.error('Error loading recent activity:', error);
      return [];
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (!hasModerationAccess) return;
    
    try {
      const [
        { count: totalReports },
        { count: pendingReports },
        { count: totalUsers },
        { count: activeUsers },
        { count: bannedUsers }
      ] = await Promise.all([
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', false)
      ]);

      // Load recent activity from reports and moderation logs
      const recentActivity = await loadRecentActivity();

      setStats({
        totalReports: totalReports || 0,
        pendingReports: pendingReports || 0,
        resolvedReports: (totalReports || 0) - (pendingReports || 0), // Calculate resolved
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        bannedUsers: bannedUsers || 0,
        recentActivity: recentActivity,
        aiAccuracy: 87.5, // Placeholder
        responseTime: 2.3, // Placeholder
        efficiency: 92.1 // Placeholder
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [hasModerationAccess, loadRecentActivity]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadReports(),
        loadLogs(),
        loadUsers(),
        loadStats()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [loadReports, loadLogs, loadUsers, loadStats]);

  const handleReport = useCallback(async (reportId: string, action: string, reason?: string) => {
    try {
      if (!user?.id) {
        toast.error('You must be logged in to handle reports');
        return;
      }

      // Map action to handleReportOrAppeal action type
      let reportAction: 'resolve' | 'dismiss' = 'resolve';
      if (action === 'dismiss' || action === 'dismissed') {
        reportAction = 'dismiss';
      } else if (action === 'in_progress' || action === 'handle') {
        // For "handle" action, we just mark as in_progress without removing notifications yet
        // The actual handling will happen when they resolve/dismiss
        // Note: reports table doesn't have updated_at column, so we don't include it
        const updateData: any = {
          status: 'in_progress',
          handled_by: user.id,
          handled_at: new Date().toISOString()
        };

        // First, verify the report exists
        const { data: existingReport, error: checkError } = await supabase
          .from('reports')
          .select('id, status')
          .eq('id', reportId)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking report:', checkError);
          throw new Error(`Failed to verify report: ${checkError.message || checkError.code || 'Unknown error'}`);
        }

        if (!existingReport) {
          throw new Error('Report not found');
        }

        // Note: No need to check role here - if user can access /moderation panel, they have staff role
        console.log('Attempting to update report:', {
          reportId,
          userId: user.id,
          updateData
        });

        // Now update the report
        // First, try without .select() to see if the update actually happens
        // Then query separately to verify
        const { error: updateError } = await supabase
          .from('reports')
          .update(updateData)
          .eq('id', reportId);

        console.log('Update result (without select):', { updateError });

        if (updateError) {
          console.error('Error updating report to in_progress:', updateError);
          console.error('Error details:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          
          throw new Error(`Failed to update report: ${updateError.message || updateError.code || 'Unknown error'}`);
        }

        // Wait a moment for the update to propagate
        await new Promise(resolve => setTimeout(resolve, 200));

        // Now query to verify the update
        const { data, error } = await supabase
          .from('reports')
          .select('id, status, handled_by, handled_at')
          .eq('id', reportId)
          .maybeSingle();

        console.log('Verification query result:', { data, error });

        if (error) {
          console.error('Error verifying report update:', error);
          throw new Error(`Failed to verify report update: ${error.message || error.code || 'Unknown error'}`);
        }

        if (!data) {
          console.error('Verification query returned no data - report may not exist or RLS is blocking');
          throw new Error('Report update failed - could not verify update');
        }

        if (data.status !== 'in_progress') {
          console.error('Verification failed - status is:', data.status, 'Expected: in_progress');
          console.error('Full report data:', data);
          console.error('Update data that was sent:', updateData);
          console.error('User role:', userProfile?.role);
          console.error('User ID:', user.id);
          
          // The update didn't work - this could be an RLS issue
          // Let's check if we can even see the report and what the current state is
          const { data: checkData, error: checkError } = await supabase
            .from('reports')
            .select('id, status, handled_by, handled_at')
            .eq('id', reportId)
            .maybeSingle();
          
          console.log('Check query result:', { checkData, checkError });
          
          // If the update didn't work, it's likely an RLS issue
          // The RLS policy might be missing the WITH CHECK clause
          throw new Error(`Report update failed - status is ${data.status}, expected in_progress. The update may have been blocked by RLS. Please ensure you have staff role in user_profiles table and run migration: 20250122000002_fix_reports_update_rls.sql`);
        }

        console.log('Update verified successfully - report status is in_progress');
        
        // Update local state
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, status: 'in_progress' as any, handled_by: user.id, handled_at: new Date().toISOString() }
            : report
        ));
        
        toast.success('Report is now being handled');
        return;
      }

      // Use the utility function to handle the report and remove notifications for other staff
      await handleReportOrAppeal('report', reportId, user.id, reportAction);
      
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: action as any, updated_at: new Date().toISOString() }
          : report
      ));
      
      toast.success(`Report ${action} successfully`);
    } catch (err: any) {
      console.error('Error handling report:', err);
      const errorMessage = err?.message || err?.code || 'Unknown error occurred';
      toast.error(`Failed to handle report: ${errorMessage}`);
      throw err; // Re-throw so the caller can handle it if needed
    }
  }, [user]);

  const handleBulkAction = useCallback(async (reportIds: string[], action: string) => {
    try {
      // Note: reports table doesn't have updated_at column
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: action
        })
        .in('id', reportIds);

      if (error) throw error;
      
      // Update local state
      setReports(prev => prev.map(report => 
        reportIds.includes(report.id)
          ? { ...report, status: action as any }
          : report
      ));
      
      toast.success(`Bulk action ${action} completed successfully`);
    } catch (err) {
      console.error('Error handling bulk action:', err);
      toast.error('Failed to handle bulk action');
    }
  }, []);

  const exportData = useCallback(async (type: 'reports' | 'logs' | 'users') => {
    try {
      let data: any[] = [];
      let filename = '';
      
      switch (type) {
        case 'reports':
          data = reports;
          filename = 'reports.csv';
          break;
        case 'logs':
          data = logs;
          filename = 'moderation_logs.csv';
          break;
        case 'users':
          data = users;
          filename = 'users.csv';
          break;
      }
      
      // Convert to CSV
      const csvContent = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type} exported successfully`);
    } catch (err) {
      console.error('Error exporting data:', err);
      toast.error('Failed to export data');
    }
  }, [reports, logs, users]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!hasModerationAccess) return;

    let reportsSubscription: any = null;
    let logsSubscription: any = null;

    const setupSubscriptions = () => {
      // Reports subscription
      reportsSubscription = supabase
        .channel('moderation_reports')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'reports'
        }, () => {
          loadReports();
        })
        .subscribe();

      // Logs subscription
      logsSubscription = supabase
        .channel('moderation_logs')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'moderation_logs'
        }, () => {
          loadLogs();
        })
        .subscribe();
    };

    setupSubscriptions();

    return () => {
      if (reportsSubscription) {
        reportsSubscription.unsubscribe();
      }
      if (logsSubscription) {
        logsSubscription.unsubscribe();
      }
    };
  }, [hasModerationAccess, loadReports, loadLogs]);

  // Load data on mount
  useEffect(() => {
    if (hasModerationAccess) {
      refreshData();
    }
  }, [hasModerationAccess, refreshData]);

  return {
    reports,
    logs,
    users,
    stats,
    loading,
    error,
    refreshData,
    handleReport,
    handleBulkAction,
    exportData
  };
}
