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
  id: string; // Note: this is the user_profiles.id (important for reports)
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

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [favorites, setFavorites] = useState<UserUpload[]>([]);
  const [loading, setLoading] = useState(true);

  const [previewItem, setPreviewItem] = useState<UserUpload | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Store logged-in user's profile id (user_profiles.id)
  const [currentUserProfileId, setCurrentUserProfileId] = useState<
    string | null
  >(null);
  // Store logged-in user's auth id and username for display or logic
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
  } | null>(null);

  useEffect(() => {
    // Get logged-in user and their user_profiles.id
    const getCurrentUserProfile = async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData.user) {
        setCurrentUser(null);
        setCurrentUserProfileId(null);
        return;
      }
      setCurrentUser({
        id: authData.user.id,
        username: authData.user.user_metadata?.username || "",
      });

      // Fetch user_profiles.id from user_id
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
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch uploads by user_profiles.user_id (which matches auth.users.id)
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

      // Fetch favorites for this user (joined on uploads)
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

  const openPreview = (item: UserUpload) => {
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
      // Optionally close modal after delay:
      setTimeout(() => {
        closeReportModal();
      }, 2000);
    }
  };

  if (loading) return <p className="text-white p-4">Loading profile...</p>;
  if (!profile) return <p className="text-white p-4">User not found.</p>;

  // Check if logged-in user is viewing their own profile
  const isOwnProfile = currentUserProfileId === profile.id;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8 flex-grow">
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
                <Menu.Button className="p-1 rounded-full hover:bg-slate-700 transition bg-slate-800">
                  <MoreHorizontal className="w-6 h-6 text-white" />
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
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-slate-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={openReportModal}
                            className={`${
                              active
                                ? "bg-purple-600 text-white"
                                : "text-slate-200"
                            } group flex w-full items-center px-4 py-2 text-sm`}
                          >
                            Report User
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>
        </div>

        {/* Username, Badges & Bio */}
        <div className="pt-20 mb-8">
          <div className="flex items-center flex-wrap">
            <h1 className="text-2xl font-bold text-white mr-4">
             @{profile.username}
            </h1>

            {/* Badges container with dark background */}
            <div className="flex bg-gray-800 bg-opacity-70 rounded-md px-1 py-0.5 mt-2">
              {profile.user_badges?.map(({ badges }) => (
                <img
                  key={badges.name}
                  src={badges.image_url}
                  alt={badges.name}
                  title={badges.name}
                  className="w-12 h-12 object-contain rounded-md"
                />
              ))}
            </div>
          </div>

          <p className="mt-2 text-slate-300">
            {profile.bio || "No bio provided."}
          </p>
        </div>

        {/* Uploads and Favorites */}
        <div className="flex gap-6">
          <section className="flex-1 max-w-[48%]">
            <h2 className="text-2xl font-semibold mb-4 text-white">Uploads</h2>
            {uploads.length === 0 ? (
              <p className="text-slate-400 italic">No uploads yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {uploads.map((upload) => (
                  <div
                    key={upload.id}
                    onClick={() => openPreview(upload)}
                    className="cursor-pointer bg-slate-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={upload.image_url}
                      alt={upload.title}
                      className="object-cover w-full h-36"
                    />
                    <div className="p-2">
                      <h3 className="text-white font-semibold">
                        {upload.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="w-px bg-slate-600 my-2 ml-6"></div>

          <section className="flex-1 max-w-[35%] ml-auto">
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Favorites
            </h2>
            {favorites.length === 0 ? (
              <p className="text-slate-400 italic">No favorites yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => openPreview(fav)}
                    className="cursor-pointer bg-slate-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={fav.image_url}
                      alt={fav.title}
                      className="object-cover w-full h-24"
                    />
                    <div className="p-2">
                      <h3 className="text-white font-semibold">{fav.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Preview Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closePreview}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl rounded bg-slate-900 p-6 shadow-xl">
                  <button
                    className="absolute top-7 right-7 text-gray-400 hover:text-white-400 bg-gray-900 py-2 px-2 rounded-full"
                    onClick={closePreview}
                    aria-label="Close preview modal"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  {previewItem && (
                    <>
                      <img
                        src={previewItem.image_url}
                        alt={previewItem.title}
                        className="w-full max-h-[70vh] object-contain rounded"
                      />
                      <h3 className="mt-4 text-white text-xl font-semibold">
                        {previewItem.title}
                      </h3>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Report Modal */}
      <Transition appear show={isReportModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeReportModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md rounded bg-slate-900 p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-medium leading-6 text-white">
                    Report User: {profile.username}
                  </Dialog.Title>

                  <div className="mt-4">
                    <label
                      htmlFor="reason"
                      className="block text-sm font-medium text-white"
                    >
                      Reason
                    </label>
                    <textarea
                      id="reason"
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-gray-700 bg-slate-800 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      disabled={reportSubmitting || reportSuccess}
                    />
                  </div>

                  {reportError && (
                    <p className="mt-2 text-sm text-red-500">{reportError}</p>
                  )}
                  {reportSuccess && (
                    <p className="mt-2 text-sm text-green-500">
                      Report submitted successfully!
                    </p>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none"
                      onClick={closeReportModal}
                      disabled={reportSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`inline-flex justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none disabled:opacity-50`}
                      onClick={submitReport}
                      disabled={reportSubmitting || reportSuccess}
                    >
                      {reportSubmitting ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Footer />
    </div>
  );
}
