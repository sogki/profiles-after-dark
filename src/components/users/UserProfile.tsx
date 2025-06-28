// src/pages/UserProfile.tsx
import React, { useEffect, useState, Fragment } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Footer from "../Footer";
import { Dialog, Transition, Menu } from "@headlessui/react";
import { X, MoreHorizontal } from "lucide-react";

interface Badge {
  name: string;
  image_url: string;
}

interface UserBadge {
  badges: Badge;
}

interface UserProfile {
  id: string; // user_profiles.id
  user_id: string; // auth.users.id
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  user_badges?: UserBadge[];
}

interface UserUpload {
  id: string;
  title: string;
  image_url: string;
  tags?: string[];
  category?: string;
  type?: string;
  created_at?: string;
}

interface ProfilePair {
  id: string;
  user_id: string;
  pfp_url: string | null;
  banner_url: string | null;
  title: string | null;
  category: string | null;
  tags?: string[];
  created_at?: string;
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [favorites, setFavorites] = useState<UserUpload[]>([]);
  const [profilePairs, setProfilePairs] = useState<ProfilePair[]>([]);
  const [loading, setLoading] = useState(true);

  const [previewItem, setPreviewItem] = useState<UserUpload | ProfilePair | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    const getCurrentUserProfile = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setCurrentUser(null);
        setCurrentUserProfileId(null);
        return;
      }
      setCurrentUser({
        id: authData.user.id,
        username: authData.user.user_metadata?.username || "",
      });

      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", authData.user.id)
        .single();

      if (profileError || !profileData) {
        setCurrentUserProfileId(null);
        return;
      }

      setCurrentUserProfileId(profileData.id);
    };

    getCurrentUserProfile();
  }, []);

  useEffect(() => {
    if (!username) return;

    const fetchProfileAndUploads = async () => {
      setLoading(true);

      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select(
          `
          id,
          user_id,
          username,
          avatar_url,
          banner_url,
          bio,
          user_badges (
            badges (
              name,
              image_url
            )
          )
        `
        )
        .eq("username", username)
        .single();

      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError);
        setProfile(null);
        setUploads([]);
        setFavorites([]);
        setProfilePairs([]);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch uploads
      const { data: uploadsData, error: uploadsError } = await supabase
        .from("profiles")
        .select("id, title, image_url, tags, category, type, created_at")
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false });

      if (uploadsError) {
        console.error("Error fetching uploads:", uploadsError);
        setUploads([]);
      } else {
        setUploads(uploadsData || []);
      }

      // Fetch profile pairs
      const { data: pairsData, error: pairsError } = await supabase
        .from("profile_pairs")
        .select("id, user_id, pfp_url, banner_url, title, category, tags, created_at")
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false });

      if (pairsError) {
        console.error("Error fetching profile pairs:", pairsError);
        setProfilePairs([]);
      } else {
        setProfilePairs(pairsData || []);
      }

      // Fetch favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("favorites")
        .select(
          `
          id,
          upload:profiles (
            id,
            title,
            image_url,
            tags,
            category,
            type,
            created_at
          )
        `
        )
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false });

      if (favoritesError) {
        console.error("Error fetching favorites:", favoritesError);
        setFavorites([]);
      } else {
        const favs = favoritesData?.map((fav: any) => fav.upload) || [];
        setFavorites(favs);
      }

      setLoading(false);
    };

    fetchProfileAndUploads();
  }, [username]);

  const openPreview = (item: UserUpload | ProfilePair) => {
    setPreviewItem(item);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewItem(null);
  };

  const openReportModal = () => {
    setReportReason("");
    setReportError(null);
    setReportSuccess(false);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
  };

  const submitReport = async () => {
    setReportError(null);
    setReportSuccess(false);

    if (!currentUserProfileId) {
      setReportError("You must be logged in to submit a report.");
      return;
    }
    if (!profile) {
      setReportError("Reported user profile not found.");
      return;
    }
    if (reportReason.trim().length === 0) {
      setReportError("Please provide a reason for the report.");
      return;
    }

    setReportSubmitting(true);

    const { error } = await supabase.from("reports").insert({
      reporter_user_id: currentUserProfileId,
      reported_user_id: profile.id,
      handled_by: null,
      reason: reportReason.trim(),
      created_at: new Date().toISOString(),
    });

    setReportSubmitting(false);

    if (error) {
      console.error("Error submitting report:", error);
      setReportError("Failed to submit report. Please try again later.");
    } else {
      setReportSuccess(true);
      setReportReason("");
      setTimeout(() => {
        closeReportModal();
      }, 2000);
    }
  };

  if (loading) return <p className="text-white p-4">Loading profile...</p>;
  if (!profile) return <p className="text-white p-4">User not found.</p>;

  const isOwnProfile = currentUserProfileId === profile.id;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8 flex-grow">
        {/* Banner & Avatar */}
        <div className="relative mb-5 rounded-lg w-[80vw] max-w-full mx-auto">
          {profile.banner_url ? (
            <img
              src={profile.banner_url}
              alt={`${profile.username}'s banner`}
              className="object-cover w-full h-48 rounded-lg"
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-slate-700 text-slate-400 italic rounded-lg">
              No banner available
            </div>
          )}

          {/* Avatar */}
          <img
            src={profile.avatar_url || "/default-avatar.png"}
            alt={`${profile.username}'s avatar`}
            className="w-24 h-24 rounded-full border-4 border-purple-600 absolute -bottom-14 left-4 object-cover bg-slate-800"
          />

          {/* Button area: Report User or Edit Profile */}
          <div className="absolute bottom-[-3.5rem] right-4">
            {isOwnProfile ? (
              <Link
                to="/profile-settings"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
              >
                Edit Profile
              </Link>
            ) : (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="inline-flex justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none">
                  <MoreHorizontal className="w-5 h-5" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-36 origin-top-right rounded-md bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={openReportModal}
                          className={`${
                            active ? "bg-slate-700" : ""
                          } block w-full px-4 py-2 text-left text-sm text-white`}
                        >
                          Report User
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>
        </div>

        {/* Username & Bio */}
        <div className="max-w-[80vw] mx-auto mt-14 mb-8 px-4">
          <h1 className="text-3xl font-bold text-white">@{profile.username}</h1>
          {profile.bio && <p className="mt-2 text-gray-300">{profile.bio}</p>}
          {profile.user_badges && profile.user_badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {profile.user_badges.map((ub, idx) => (
                <img
                  key={idx}
                  src={ub.badges.image_url}
                  alt={ub.badges.name}
                  title={ub.badges.name}
                  className="h-10 w-10 rounded-full"
                />
              ))}
            </div>
          )}
        </div>

        {/* Main content grid: Profile Pairs, Uploads, Favorites */}
        <div className="max-w-[80vw] mx-auto flex gap-8 px-4">
          {/* Left Column */}
          <div className="flex flex-col flex-grow max-w-[40vw] gap-4">
            {/* Profile Pairs */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Profile Pairs</h2>
              {profilePairs.length === 0 ? (
                <p className="text-gray-400 italic">No profile pairs found.</p>
              ) : (
                <div className="flex flex-col gap-6">
                  {profilePairs.map((pair) => (
                    <div
                      key={pair.id}
                      className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800 shadow-lg cursor-pointer"
                      onClick={() => openPreview(pair)}
                    >
                      {/* Banner */}
                      <div className="relative h-28 w-full">
                        {pair.banner_url ? (
                          <img
                            src={pair.banner_url}
                            alt={pair.title || "Pair banner"}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="bg-slate-700 flex items-center justify-center h-full text-gray-400 italic">
                            No banner
                          </div>
                        )}

                        {/* Avatar overlapping bottom-left corner */}
                        <div className="absolute -bottom-8 left-4 w-20 h-20 rounded-full border-4 border-slate-900 overflow-hidden bg-slate-900 shadow-md">
                          {pair.pfp_url ? (
                            <img
                              src={pair.pfp_url}
                              alt={pair.title || "Pair avatar"}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 italic">
                              No Avatar
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Spacer for avatar overlap */}
                      <div className="h-12" />

                      {/* Title and category */}
                      <div className="p-4 pt-2 text-white">
                        <h3 className="text-lg font-semibold">{pair.title || "Untitled"}</h3>
                        <p className="text-sm text-gray-400">{pair.category || "No category"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Uploads */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Uploads</h2>
              {uploads.length === 0 ? (
                <p className="text-gray-400 italic">No uploads found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {uploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="bg-slate-800 rounded-lg overflow-hidden shadow cursor-pointer hover:scale-[1.03] transition-transform"
                      onClick={() => openPreview(upload)}
                    >
                      <img
                        src={upload.image_url}
                        alt={upload.title || "Upload image"}
                        className="object-cover w-full h-48"
                      />
                      <div className="p-3 text-white">
                        <h3 className="font-semibold">{upload.title || "Untitled"}</h3>
                        <p className="text-sm text-gray-400">{upload.category || "No category"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Favorites sidebar */}
          <aside className="sticky top-20 h-[80vh] w-72 bg-slate-800 rounded-lg overflow-y-auto shadow-lg px-4 py-6 text-white">
            <h2 className="text-xl font-semibold mb-4">Favorites</h2>
            {favorites.length === 0 ? (
              <p className="italic text-gray-400">No favorites found.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {favorites.map((fav) => (
                  <li
                    key={fav.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-slate-700 rounded-md p-2"
                    onClick={() => openPreview(fav)}
                  >
                    <img
                      src={fav.image_url}
                      alt={fav.title || "Favorite image"}
                      className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                    />
                    <div>
                      <p className="font-semibold">{fav.title || "Untitled"}</p>
                      <p className="text-xs text-gray-400">{fav.category || "No category"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>

      <Footer />

      {/* Preview Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={closePreview}
          static
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-80" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="max-w-3xl w-full bg-slate-900 rounded-lg shadow-lg p-4 relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  onClick={closePreview}
                  aria-label="Close preview"
                >
                  <X />
                </button>
                {previewItem && "image_url" in previewItem && (
                  <>
                    <img
                      src={previewItem.image_url}
                      alt={previewItem.title || "Preview image"}
                      className="w-full max-h-[60vh] object-contain rounded-md"
                    />
                    <h3 className="mt-3 text-white text-lg font-semibold">
                      {previewItem.title || "Untitled"}
                    </h3>
                    <p className="text-gray-400">{previewItem.category || "No category"}</p>
                    {previewItem.tags && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {previewItem.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="bg-slate-700 text-xs text-white rounded px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Report Modal */}
      <Transition appear show={isReportModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeReportModal} static>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-70" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-slate-900 rounded-lg max-w-md w-full p-6">
                <Dialog.Title className="text-lg font-semibold text-white mb-4">Report User</Dialog.Title>
                <textarea
                  rows={4}
                  placeholder="Describe the reason for reporting this user..."
                  className="w-full p-2 rounded-md bg-slate-700 text-white focus:outline-none resize-none"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  disabled={reportSubmitting || reportSuccess}
                />
                {reportError && <p className="text-red-500 mt-2">{reportError}</p>}
                {reportSuccess && <p className="text-green-500 mt-2">Report submitted successfully.</p>}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={closeReportModal}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                    disabled={reportSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReport}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
                    disabled={reportSubmitting || reportSuccess}
                  >
                    {reportSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
