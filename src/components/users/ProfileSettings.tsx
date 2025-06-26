import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Loader, Save, Edit2, User } from "lucide-react";
import toast from "react-hot-toast";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

import Footer from "../Footer";

type Profile = {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
};

type Notification = {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
};

export default function ProfileSettings() {
  const [profile, setProfile] = useState<Profile>({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"account" | "security" | "notifications">("account");

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Notifications state & loading
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          toast.error("Failed to fetch user");
          setLoading(false);
          return;
        }

        setUser(user);
        setEmail(user.email ?? "");

        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setProfile(data);
        } else if (error) {
          toast.error("Failed to fetch profile");
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
        toast.error("Unexpected error fetching profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "notifications" && user) {
      const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) {
            toast.error("Failed to fetch notifications");
          } else if (data) {
            setNotifications(data);
          }
        } catch (error) {
          console.error("Fetch notifications error:", error);
          toast.error("Unexpected error fetching notifications");
        } finally {
          setLoadingNotifications(false);
        }
      };

      fetchNotifications();
    }
  }, [activeTab, user]);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "avatar_url" | "banner_url"
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("No file selected.");
      return;
    }
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }

    setLoading(true);

    const bucket = field === "avatar_url" ? "avatars" : "banners";
    const filePath = `${user.id}/${field}-${Date.now()}-${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData, error: urlError } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (urlError) throw urlError;
      if (!urlData?.publicUrl) throw new Error("No public URL returned.");

      const publicUrl = urlData.publicUrl;

      setProfile((prev) => ({ ...prev, [field]: publicUrl }));

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ [field]: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success(`${field === "avatar_url" ? "Avatar" : "Banner"} uploaded successfully.`);
    } catch (error: any) {
      if (error?.message) toast.error(`Upload error: ${error.message}`);
      else toast.error("Failed to upload file.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("user_profiles")
      .update(profile)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update profile.");
    } else {
      toast.success("Profile updated successfully.");
    }

    setLoading(false);
  };

  const updateEmailPassword = async () => {
    if (!user) return;
    if (password && password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      if (email && email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        toast.success("Email updated successfully.");
      }
      if (password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated successfully.");
      }
    } catch (error) {
      toast.error("Failed to update email or password.");
    } finally {
      setLoading(false);
      setPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const currentUser = supabase.auth.user();
      if (!currentUser) {
        alert("No user logged in.");
        setIsDeleting(false);
        return;
      }

      const { error } = await supabase.rpc("delete_user_account", { uid: currentUser.id });

      if (error) {
        alert(`Failed to delete account: ${error.message}`);
        setIsDeleting(false);
        return;
      }

      alert("Your account has been deleted successfully.");
      await supabase.auth.signOut();
      // navigate('/goodbye');
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6 max-w-7xl mx-auto grid grid-cols-12 gap-6 md:gap-8">
      {/* Sidebar */}
      <aside className="col-span-12 md:col-span-3 bg-slate-800 rounded-lg p-6 space-y-6 self-start">
        <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">Settings Menu</h2>
        <nav className="flex flex-col space-y-3 text-slate-300">
          <button
            onClick={() => setActiveTab("account")}
            className={`text-left transition ${
              activeTab === "account" ? "text-white font-semibold" : "hover:text-white"
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`text-left transition ${
              activeTab === "security" ? "text-white font-semibold" : "hover:text-white"
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`text-left transition ${
              activeTab === "notifications" ? "text-white font-semibold" : "hover:text-white"
            }`}
          >
            Notifications
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="col-span-12 md:col-span-9 space-y-8">
        {loading && (
          <div className="flex justify-center">
            <Loader className="animate-spin text-purple-400" size={32} />
          </div>
        )}

        {activeTab === "account" && (
          <>
            <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

            {/* Banner + Avatar */}
            <div className="relative mb-20 rounded-lg">
              <div
                className="relative h-40 md:h-48 bg-slate-700 rounded-lg cursor-pointer group overflow-hidden"
                onClick={() => bannerInputRef.current?.click()}
                title="Click to change banner"
              >
                {profile.banner_url ? (
                  <img
                    src={profile.banner_url}
                    alt="Banner"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 rounded-lg">
                    No banner set
                  </div>
                )}

                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 rounded-lg">
                  <Edit2 className="text-white h-8 w-8" />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={bannerInputRef}
                  onChange={(e) => handleUpload(e, "banner_url")}
                />
              </div>

              <div
                onClick={() => avatarInputRef.current?.click()}
                title="Click to change avatar"
                className="
                  absolute
                  left-6 md:left-10
                  bottom-[-48px] md:bottom-[-56px]
                  w-24 h-24 md:w-28 md:h-28
                  rounded-full
                  border-4 border-slate-900
                  bg-slate-700
                  cursor-pointer
                  group
                  overflow-hidden
                  shadow-lg
                  flex items-center justify-center
                  transition-transform duration-300 hover:scale-105
                  z-30
                "
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-slate-400" />
                )}

                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity duration-300">
                  <Edit2 className="text-white h-6 w-6" />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={avatarInputRef}
                  onChange={(e) => handleUpload(e, "avatar_url")}
                />
              </div>
            </div>

            {/* Profile form */}
            <div className="space-y-6 pt-12">
              <div>
                <label className="block mb-1 font-semibold">Username</label>
                <input
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Display Name</label>
                <input
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Bio</label>
                <textarea
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center justify-center space-x-3 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded font-semibold transition-transform duration-200 hover:scale-105"
              >
                <Save className="h-5 w-5" />
                <span>Save Profile</span>
              </button>
            </div>
          </>
        )}

        {activeTab === "security" && (
          <section className="pt-8 border-t border-slate-700 space-y-6">
            <h1 className="text-3xl font-bold mb-6">Security Settings</h1>

            <div>
              <label className="block mb-1 font-semibold">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Email"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Password"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Confirm Password"
              />
            </div>

            <button
              onClick={updateEmailPassword}
              className="flex items-center justify-center space-x-3 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded font-semibold transition-transform duration-200 hover:scale-105"
              disabled={loading}
            >
              <Save className="h-5 w-5" />
              <span>Update Security Settings</span>
            </button>

            <hr className="border-slate-700" />

            <div className="pt-6">
              <h2 className="text-xl font-semibold mb-2">Delete Account</h2>
              <p className="mb-4 text-slate-400">
                Deleting your account is permanent and will remove all your data.
                This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-semibold transition-transform duration-200 hover:scale-105"
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </section>
        )}

        {activeTab === "notifications" && (
          <section className="pt-8 border-t border-slate-700 space-y-6">
            <h1 className="text-3xl font-bold mb-6">Notifications</h1>

            {loadingNotifications ? (
              <div className="flex justify-center">
                <Loader className="animate-spin text-purple-400" size={32} />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-slate-400">You have no notifications.</p>
            ) : (
              <ul className="space-y-4 max-h-96 overflow-y-auto">
                {notifications.map((note) => (
                  <li
                    key={note.id}
                    className={`p-4 rounded-lg border ${
                      note.read ? "border-slate-700 bg-slate-800" : "border-purple-600 bg-purple-900"
                    }`}
                  >
                    <p>{note.message}</p>
                    <small className="text-slate-400">
                      {new Date(note.created_at).toLocaleString()}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

    </div>
  );
}
