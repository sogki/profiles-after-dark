import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface ModerationLog {
  id: string;
  moderator_id: string;
  action: string;
  target_user_id: string;
  title?: string;
  tags?: string[];
  content_url?: string; // Optional, might be null or undefined
  created_at: string;
}

interface UserSummary {
  user_id: string;
  display_name: string | null;
  username: string | null;
}

interface ModerationLogsProps {
  logs: ModerationLog[];
  usersMap: Record<string, UserSummary>;
}

const ModerationLogs: React.FC<ModerationLogsProps> = ({ logs, usersMap }) => {
  if (logs.length === 0) {
    return <p className="text-gray-400">No moderation logs available.</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Moderation Logs</h1>
      <div className="space-y-6">
        {logs.map((log) => {
          const moderator = usersMap[log.moderator_id];
          const moderatorName = moderator?.display_name || moderator?.username || log.moderator_id;

          const tagsText = log.tags?.length ? log.tags.join(', ') : 'No tags';

          return (
            <div
              key={log.id}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700 shadow"
              style={{ minHeight: 140 }}
            >
              <p className="text-sm text-slate-400 mb-1">
                <strong>Moderator:</strong> {moderatorName}
              </p>
              <p className="text-lg font-semibold text-white mb-1">
                {log.title || log.action || 'Moderation action'}
              </p>
              <p className="text-sm text-slate-400 mb-1">
                <strong>Action:</strong> {log.action}
              </p>
              <p className="text-sm text-slate-400 mb-1">
                <strong>Target User ID:</strong> {log.target_user_id}
              </p>
              <p className="text-sm text-slate-400 mb-2">
                <strong>Tags:</strong> {tagsText}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ModerationLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserSummary>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);

      // Fetch moderation logs
      const { data: logsData, error: logsError } = await supabase
        .from('moderation_logs')
        .select(`
          id,
          moderator_id,
          action,
          target_user_id,
          title,
          tags,
          content_url,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (logsError) {
        console.error('Error fetching moderation logs:', logsError);
        setLoading(false);
        return;
      }

      if (!logsData || logsData.length === 0) {
        setLogs([]);
        setUsersMap({});
        setLoading(false);
        return;
      }

      setLogs(logsData);

      // Extract unique moderator IDs to fetch their info
      const moderatorIds = Array.from(new Set(logsData.map(log => log.moderator_id)));

      // Fetch user summaries for moderators
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id as user_id, display_name, username')
        .in('id', moderatorIds);

      if (usersError) {
        console.error('Error fetching moderators:', usersError);
        setUsersMap({});
      } else if (usersData) {
        const map: Record<string, UserSummary> = {};
        usersData.forEach(user => {
          map[user.user_id] = user;
        });
        setUsersMap(map);
      }

      setLoading(false);
    }

    loadLogs();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading moderation logs...</p>;

  return <ModerationLogs logs={logs} usersMap={usersMap} />;
};

export default ModerationLogsPage;
