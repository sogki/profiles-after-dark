import { useEffect, useState } from "react";
import { useAuth } from "../../../context/authContext";
import { supabase } from "../../../lib/supabase";
import { Navigate } from "react-router-dom";
import { BarChart, Database, Loader, UserCog } from "lucide-react";
import toast from "react-hot-toast";
import ModerationLogs from "./ModerationLogs";


import {
  Users,
  ListChecks,
  Megaphone,
  Save,
  XCircle,
  Trash2,
  Edit2,
} from "lucide-react";

interface ReportedUser {
  id: string;
  reason: string;
  created_at: string;
  reported_user: { username: string; avatar_url?: string; id?: string } | null;
  reporter_user: { username: string } | null;
}

interface Log {
  id: string;
  moderator_id: string;
  action: string;
  target_user_id: string;
  target_profile_id: string | null;
  description: string | null;
  created_at: string;
  title?: string;
  tags?: string[];
  content_url?: string;
}

interface UserSummary {
  user_id: string;
  display_name: string | null;
  username: string | null;
}

const ModerationPanel = () => {
  const { userProfile, loading } = useAuth();

  const [announcement, setAnnouncement] = useState<string | null>(null);

  const [reports, setReports] = useState<ReportedUser[]>([]);
  const [fetchingReports, setFetchingReports] = useState(true);
  const [activeTab, setActiveTab] = useState<"reportedUsers" | "logs">(
    "reportedUsers"
  );
  const [logs, setLogs] = useState<Log[]>([]);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [usersMap, setUsersMap] = useState<Record<string, UserSummary>>({});

  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    "warn" | "restrict" | "terminate" | null
  >(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState("");

  // Announcement editing state
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState("");

  // Save edited or new announcement to DB
  const saveAnnouncement = async () => {
    try {
      const { data, error } = await supabase.from("announcements").upsert(
        [
          {
            id: 1, // Using a fixed id for the single announcement bar
            message: announcementDraft,
            is_active: true,
          },
        ],
        { onConflict: ["id"] }
      );

      if (error) throw error;

      toast.success("Announcement saved");
      setAnnouncement(announcementDraft);
      setIsEditingAnnouncement(false);
    } catch (error) {
      toast.error("Failed to save announcement");
      console.error(error);
    }
  };

  // Delete (deactivate) announcement
  const deleteAnnouncement = async () => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: false })
        .eq("id", 1);

      if (error) throw error;

      toast.success("Announcement deleted");
      setAnnouncement(null);
      setIsEditingAnnouncement(false);
    } catch (error) {
      toast.error("Failed to delete announcement");
      console.error(error);
    }
  };

  const fetchReports = async () => {
    setFetchingReports(true);
    const { data, error } = await supabase
      .from("reports")
      .select(
        `
        id,
        reason,
        created_at,
        reported_user:user_profiles!reports_reported_user_id_fkey(username, avatar_url, id),
        reporter_user:user_profiles!reports_reporter_user_id_fkey(username)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch reports", error);
      toast.error("Failed to fetch reported users");
    } else {
      setReports(data as ReportedUser[]);
    }
    setFetchingReports(false);
  };

  const fetchLogs = async () => {
    setFetchingLogs(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("moderation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsError) {
        console.error("Failed to fetch logs", logsError);
        toast.error("Failed to fetch moderation logs");
        setFetchingLogs(false);
        return;
      }
      if (!logsData) {
        setFetchingLogs(false);
        return;
      }
      setLogs(logsData);

      const userIdsSet = new Set<string>();
      logsData.forEach((log) => {
        if (log.moderator_id) userIdsSet.add(log.moderator_id);
        if (log.target_user_id) userIdsSet.add(log.target_user_id);
      });
      const userIds = Array.from(userIdsSet);

      if (userIds.length === 0) {
        setUsersMap({});
        setFetchingLogs(false);
        return;
      }

      const { data: usersData, error: usersError } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, username")
        .in("user_id", userIds);

      if (usersError) {
        console.error("Failed to fetch users", usersError);
        toast.error("Failed to fetch user info for logs");
        setUsersMap({});
        setFetchingLogs(false);
        return;
      }

      const userMap: Record<string, UserSummary> = {};
      usersData?.forEach((u) => {
        userMap[u.user_id] = {
          user_id: u.user_id,
          display_name: u.display_name,
          username: u.username,
        };
      });
      setUsersMap(userMap);
    } catch (error) {
      console.error("Unexpected error fetching logs", error);
      toast.error("Unexpected error fetching moderation logs");
    } finally {
      setFetchingLogs(false);
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, message, is_active")
        .order("created_at", { ascending: false })
        .limit(1); // get max 1 row, returns array

      if (error) {
        console.error("Failed to fetch announcement", error);
        toast.error("Failed to fetch announcement");
        setAnnouncement(null);
        return;
      }

      if (data.length > 0 && data[0].is_active) {
        setAnnouncement(data[0].message);
      } else {
        setAnnouncement(null);
      }
    } catch (err) {
      console.error("Unexpected error fetching announcement", err);
      toast.error("Unexpected error fetching announcement");
      setAnnouncement(null);
    }
  };

  useEffect(() => {
    fetchAnnouncement();

    const channel = supabase
      .channel("realtime:announcements")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        (payload) => {
          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            if (payload.new?.is_active) {
              setAnnouncement(payload.new.message);
            } else {
              setAnnouncement(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (userProfile?.role === "staff") {
      if (activeTab === "reportedUsers") {
        fetchReports();
      } else if (activeTab === "logs") {
        fetchLogs();
      }
    }
  }, [userProfile, activeTab]);

  const handleDismiss = async (id: string) => {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) {
      toast.error("Failed to dismiss report");
      console.error("Failed to delete report:", error);
      return;
    }
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const openActionModal = (
    action: "warn" | "restrict" | "terminate",
    userId: string
  ) => {
    setSelectedAction(action);
    setSelectedUserId(userId);
    setWarningMessage("");
    setShowActionModal(true);
  };

  const closeModal = () => {
    setShowActionModal(false);
    setSelectedAction(null);
    setSelectedUserId(null);
    setWarningMessage("");
  };

  const handleActionConfirmed = async () => {
    if (!selectedUserId || !selectedAction) {
      toast.error("No action selected or target user missing");
      closeModal();
      return;
    }

    try {
      if (selectedAction === "warn") {
        const { error } = await supabase.from("user_warnings").insert([
          {
            user_id: selectedUserId,
            moderator_id: userProfile?.user_id,
            message: warningMessage || "No message provided",
          },
        ]);
        if (error) throw error;

        toast.success(`User ${selectedUserId} has been warned.`);
      } else if (selectedAction === "restrict") {
        const { error } = await supabase
          .from("user_profiles")
          .update({ restricted: true })
          .eq("user_id", selectedUserId);

        if (error) throw error;

        toast.success(`User ${selectedUserId} has been restricted.`);
      } else if (selectedAction === "terminate") {
        const { error } = await supabase
          .from("user_profiles")
          .update({ terminated: true })
          .eq("user_id", selectedUserId);

        if (error) throw error;

        toast.success(`User ${selectedUserId} has been terminated.`);
      }

      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: `${selectedAction} user`,
          target_user_id: selectedUserId,
          description:
            selectedAction === "warn"
              ? `Warned user with message: ${warningMessage}`
              : `Performed ${selectedAction} on user`,
        },
      ]);

      if (activeTab === "reportedUsers") await fetchReports();
      if (activeTab === "logs") await fetchLogs();
    } catch (error) {
      console.error("Failed to perform action:", error);
      toast.error("Failed to perform action. See console for details.");
    } finally {
      closeModal();
    }
  };

  if (!loading && userProfile?.role !== "staff") return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6 max-w-8xl mx-auto grid grid-cols-12 gap-6 md:gap-8">
      <aside className="col-span-12 md:col-span-3 bg-slate-800 rounded-lg p-6 flex flex-col space-y-6 self-start">
        <h2 className="text-2xl font-semibold border-b border-slate-700 pb-3 mb-4">
          Moderation Panel
        </h2>

        {/* Moderation Section */}
        <section>
          <h3 className="text-lg font-semibold text-slate-400 mb-3 uppercase tracking-wide">
            Moderation
          </h3>
          <nav className="flex flex-col space-y-3 text-slate-300">
            <button
              onClick={() => setActiveTab("reportedUsers")}
              className={`flex items-center space-x-2 transition rounded px-3 py-2 ${
                activeTab === "reportedUsers"
                  ? "bg-slate-700 text-white font-semibold"
                  : "hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Users size={18} />
              <span>Reported Users</span>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center space-x-2 transition rounded px-3 py-2 ${
                activeTab === "logs"
                  ? "bg-slate-700 text-white font-semibold"
                  : "hover:bg-slate-700 hover:text-white"
              }`}
            >
              <ListChecks size={18} />
              <span>Logs</span>
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex items-center space-x-2 transition rounded px-3 py-2 ${
                activeTab === "activity"
                  ? "bg-slate-700 text-white font-semibold"
                  : "hover:bg-slate-700 hover:text-white"
              }`}
            >
              <BarChart size={18} />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab("user-management")}
              className={`flex items-center space-x-2 transition rounded px-3 py-2 ${
                activeTab === "user-management"
                  ? "bg-slate-700 text-white font-semibold"
                  : "hover:bg-slate-700 hover:text-white"
              }`}
            >
              <UserCog size={18} />
              <span>User Management</span>
            </button>
            <button
              onClick={() => setActiveTab("dev-portal")}
              className={`flex items-center space-x-2 transition rounded px-3 py-2 ${
                activeTab === "dev-portal"
                  ? "bg-slate-700 text-white font-semibold"
                  : "hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Database size={18} />
              <span>Developer Portal</span>
            </button>
          </nav>
        </section>

        {/* Announcements Section */}
        {userProfile?.role === "staff" && (
          <section className="mt-auto">
            <h3 className="text-lg font-semibold text-slate-400 mb-3 uppercase tracking-wide flex items-center space-x-2">
              <Megaphone size={20} />
              <span>Announcements</span>
            </h3>

            {isEditingAnnouncement ? (
              <div className="flex flex-col space-y-4">
                <textarea
                  value={announcementDraft}
                  onChange={(e) => setAnnouncementDraft(e.target.value)}
                  className="resize-none rounded bg-blue-800/15 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px]"
                  rows={4}
                  placeholder="Write your announcement here..."
                />
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={saveAnnouncement}
                    className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition"
                  >
                    <Save size={20} />
                    <span></span>
                  </button>
                  <button
                    onClick={() => setIsEditingAnnouncement(false)}
                    className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition"
                  >
                    <XCircle size={20} />
                    <span></span>
                  </button>
                  {announcement && (
                    <button
                      onClick={deleteAnnouncement}
                      className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
                    >
                      <Trash2 size={20} />
                      <span></span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start space-x-3">
                <p className="text-sm leading-relaxed overflow-y-auto max-h-20 whitespace-pre-wrap">
                  {announcement || "No active announcements."}
                </p>
                <button
                  onClick={() => {
                    setAnnouncementDraft(announcement || "");
                    setIsEditingAnnouncement(true);
                  }}
                  className="text-sm bg-black bg-opacity-30 px-3 py-1 rounded hover:bg-opacity-50 transition flex items-center space-x-"
                  aria-label="Edit announcement"
                >
                  <Edit2 size={16} />
                  <span>Edit</span>
                </button>
              </div>
            )}
          </section>
        )}
      </aside>

      <main className="col-span-12 md:col-span-9 space-y-8">
        {activeTab === "reportedUsers" && (
          <>
            {fetchingReports && (
              <div className="flex justify-center py-8">
                <Loader className="animate-spin" size={32} />
              </div>
            )}
            {!fetchingReports && reports.length === 0 && (
              <p className="text-gray-400">No reported users.</p>
            )}
            {!fetchingReports && reports.length > 0 && (
              <div className="space-y-4">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="relative flex bg-slate-800 rounded-lg overflow-hidden min-h-[120px]"
                  >
                    {/* Avatar container filling full height */}
                    <div className="relative h-60 w-60 h-full flex-shrink-0">
                      <img
                        src={
                          r.reported_user?.avatar_url
                            ? r.reported_user.avatar_url
                            : `https://your-cdn.com/profiles/${
                                r.reported_user?.username || "default"
                              }.jpg`
                        }
                        alt={`Profile of ${
                          r.reported_user?.username || "Unknown"
                        }`}
                        className="w-full h-full object-cover"
                      />
                      {/* Fade effect on right side of avatar */}
                      <div className="absolute top-0 right-0 h-full w-20 pointer-events-none bg-gradient-to-l from-slate-900/90 to-transparent" />
                    </div>

                    {/* Report details */}
                    <div className="flex-1 px-6 py-4 text-white">
                      <h3 className="text-lg font-semibold mb-1">
                        {r.reported_user?.username || "Unknown User"}
                      </h3>
                      <p className="mb-1 text-slate-300">
                        <span className="font-semibold text-slate-400">
                          Reported by:{" "}
                        </span>
                        {r.reporter_user?.username || "Unknown"}
                      </p>
                      <p className="mb-2 text-slate-300">
                        <span className="font-semibold text-slate-400">
                          Reason:{" "}
                        </span>
                        {r.reason}
                      </p>
                      <p className="text-slate-400 text-sm mb-4">
                        Reported at: {new Date(r.created_at).toLocaleString()}
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() =>
                            openActionModal("warn", r.reported_user?.id || "")
                          }
                          className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-700 transition"
                        >
                          Warn
                        </button>
                        <button
                          onClick={() =>
                            openActionModal(
                              "restrict",
                              r.reported_user?.id || ""
                            )
                          }
                          className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-700 transition"
                        >
                          Restrict
                        </button>
                        <button
                          onClick={() =>
                            openActionModal(
                              "terminate",
                              r.reported_user?.id || ""
                            )
                          }
                          className="px-3 py-1 rounded bg-red-700 hover:bg-red-800 transition"
                        >
                          Terminate
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to dismiss this report?"
                              )
                            ) {
                              handleDismiss(r.id);
                            }
                          }}
                          className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-700 transition"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "logs" && (
          <>
            {fetchingLogs && (
              <div className="flex justify-center py-8">
                <Loader className="animate-spin" size={32} />
              </div>
            )}
            {!fetchingLogs && logs.length === 0 && (
              <p className="text-gray-400">No moderation logs.</p>
            )}
            {!fetchingLogs && logs.length > 0 && (
              <ModerationLogs logs={logs} usersMap={usersMap} />
            )}
          </>
        )}

        {/* Action Modal */}
        {showActionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
            <div className="bg-slate-900 rounded-lg p-6 max-w-lg w-full space-y-4">
              <h3 className="text-xl font-semibold text-white">
                {selectedAction === "warn" && "Warn User"}
                {selectedAction === "restrict" && "Restrict User"}
                {selectedAction === "terminate" && "Terminate User"}
              </h3>
              {selectedAction === "warn" && (
                <textarea
                  className="w-full h-24 p-2 rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter warning message (optional)"
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                />
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActionConfirmed}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ModerationPanel;
