import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Loader, Save, Edit2, User } from "lucide-react";
import toast from "react-hot-toast";
import { User as SupabaseUser } from "@supabase/supabase-js";

type Profile = {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
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
  const [activeTab, setActiveTab] = useState<"account" | "security">("account");

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

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

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "avatar_url" | "banner_url"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);

    // Choose correct bucket
    const bucket = field === "avatar_url" ? "avatars" : "banners";
    const filePath = `${user.id}/${field}-${Date.now()}`;

    try {
      // Upload to correct bucket
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL from the same bucket
      const { data: urlData, error: urlError } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (urlError || !urlData?.publicUrl)
        throw urlError || new Error("Failed to get public URL");

      const publicUrl = urlData.publicUrl;

      // Update local state
      setProfile((prev) => ({ ...prev, [field]: publicUrl }));

      // Persist to DB
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ [field]: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success(
        `${field === "avatar_url" ? "Avatar" : "Banner"} uploaded successfully.`
      );
    } catch (error) {
      console.error(error);
      toast.error(
        `Failed to upload ${field === "avatar_url" ? "avatar" : "banner"}.`
      );
    } finally {
      setLoading(false);
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
    } catch {
      toast.error("Failed to update email or password.");
    } finally {
      setLoading(false);
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6 max-w-7xl mx-auto grid grid-cols-12 gap-6 md:gap-8">
      {/* Sidebar */}
      <aside className="col-span-12 md:col-span-3 bg-slate-800 rounded-lg p-6 space-y-6 self-start">
        <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">
          Settings Menu
        </h2>
        <nav className="flex flex-col space-y-3 text-slate-300">
          <button
            onClick={() => setActiveTab("account")}
            className={`text-left transition ${
              activeTab === "account"
                ? "text-white font-semibold"
                : "hover:text-white"
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`text-left transition ${
              activeTab === "security"
                ? "text-white font-semibold"
                : "hover:text-white"
            }`}
          >
            Security
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

            {/* Banner + Avatar container */}
            <div className="relative mb-20 rounded-lg">
              {/* Banner */}
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

                {/* Banner overlay edit icon */}
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

              {/* Avatar */}
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

            {/* Profile Form */}
            <div className="space-y-6 pt-12">
              <div>
                <label className="block mb-1 font-semibold">Username</label>
                <input
                  value={profile.username}
                  onChange={(e) =>
                    setProfile({ ...profile, username: e.target.value })
                  }
                  className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Display Name</label>
                <input
                  value={profile.display_name}
                  onChange={(e) =>
                    setProfile({ ...profile, display_name: e.target.value })
                  }
                  className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={4}
                />
              </div>

              <button
                onClick={handleSave}
                className="flex items-center justify-center space-x-3 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded font-semibold transition-transform duration-200 hover:scale-105"
                disabled={loading}
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
              <label className="block mb-1 font-semibold">New Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="New password"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-700 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Confirm new password"
              />
            </div>

            <button
              onClick={updateEmailPassword}
              className="flex items-center justify-center space-x-3 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded font-semibold transition-transform duration-200 hover:scale-105"
              disabled={loading}
            >
              <Save className="h-5 w-5" />
              <span>Update Email/Password</span>
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
