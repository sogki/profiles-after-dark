import { useEffect, useState, Fragment } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import { Transition, Menu } from "@headlessui/react"
import { MoreHorizontal, Settings, Flag, Heart, Grid3X3, User, Calendar } from "lucide-react"
import ReportModal from "./moderation/ReportModal"
import { useAuth } from "../../context/authContext"
import toast from "react-hot-toast"
import Footer from "../Footer"

interface Badge {
  name: string
  image_url: string
}

interface UserBadge {
  badges: Badge
}

interface UserProfile {
  id: string
  user_id: string
  username: string
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  user_badges?: UserBadge[]
  created_at?: string
}

interface UserUpload {
  id: string
  title: string
  image_url: string
  tags?: string[]
  category?: string
  type?: string
  created_at?: string
}

interface ProfilePair {
  id: string
  user_id: string
  pfp_url: string | null
  banner_url: string | null
  title: string | null
  category: string | null
  tags?: string[]
  created_at?: string
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>()
  const { userProfile: currentUserProfile } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [uploads, setUploads] = useState<UserUpload[]>([])
  const [favorites, setFavorites] = useState<UserUpload[]>([])
  const [profilePairs, setProfilePairs] = useState<ProfilePair[]>([])
  const [loading, setLoading] = useState(true)

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false)

  const [activeTab, setActiveTab] = useState<"uploads" | "pairs" | "favorites">("uploads")

  useEffect(() => {
    if (!username) return

    const fetchProfileAndUploads = async () => {
      setLoading(true)

      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select(`
          id,
          user_id,
          username,
          avatar_url,
          banner_url,
          bio,
          created_at,
          user_badges (
            badges (
              name,
              image_url
            )
          )
        `)
        .eq("username", username)
        .single()

      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError)
        setProfile(null)
        setUploads([])
        setFavorites([])
        setProfilePairs([])
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Fetch uploads
      const { data: uploadsData, error: uploadsError } = await supabase
        .from("profiles")
        .select("id, title, image_url, tags, category, type, created_at")
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false })

      if (uploadsError) {
        console.error("Error fetching uploads:", uploadsError)
        setUploads([])
      } else {
        setUploads(uploadsData || [])
      }

      // Fetch profile pairs
      const { data: pairsData, error: pairsError } = await supabase
        .from("profile_pairs")
        .select("id, user_id, pfp_url, banner_url, title, category, tags, created_at")
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false })

      if (pairsError) {
        console.error("Error fetching profile pairs:", pairsError)
        setProfilePairs([])
      } else {
        setProfilePairs(pairsData || [])
      }

      // Fetch favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("favorites")
        .select(`
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
        `)
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false })

      if (favoritesError) {
        console.error("Error fetching favorites:", favoritesError)
        setFavorites([])
      } else {
        const favs = favoritesData?.map((fav: any) => fav.upload) || []
        setFavorites(favs)
      }

      setLoading(false)
    }

    fetchProfileAndUploads()
  }, [username])

  const openReportModal = () => {
    if (!currentUserProfile) {
      toast.error("You must be logged in to report a user")
      return
    }
    setShowReportModal(true)
  }

  const closeReportModal = () => {
    setShowReportModal(false)
  }

  const handleReportSubmitted = () => {
    toast.success("Report submitted successfully. Thank you for helping keep our community safe.")
    closeReportModal()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">User not found</h2>
          <p className="text-gray-400">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUserProfile?.user_id === profile.user_id

  return (
    <><div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="relative mb-8">
          {/* Banner */}
          <div className="relative h-64 md:h-80 rounded-2xl overflow-visible bg-gradient-to-r from-purple-600 to-blue-600">
            {profile.banner_url ? (
              <img
                src={profile.banner_url || "/placeholder.svg"}
                alt={`${profile.username}'s banner`}
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <div className="text-white/20 text-6xl">
                  <User />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20"></div>

            {/* Avatar */}
            <img
              src={profile.avatar_url || "/default-avatar.png"}
              alt={`${profile.username}'s avatar`}
              className="w-32 h-32 rounded-full border-4 border-slate-800 absolute -bottom-20 left-1/2 transform -translate-x-1/2 border-solid bg-slate-900 shadow-xl object-cover" />
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Action Button */}
            <div className="absolute bottom-20 right-6">
              {isOwnProfile ? (
                <Link
                  to="/profile-settings"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </Link>
              ) : (
                <Menu as="div" className="relative">
                  <Menu.Button className="inline-flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
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
                    <Menu.Items className="absolute right-0 mt-2 w-48 bg-purple-800 rounded-xl shadow-lg ring-1 text-white ring-black/5 focus:outline-none z-50">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={openReportModal}
                            className={`${active ? "bg-white/50 text-purple-800" : "text-white-700"} flex items-center gap-3 w-full px-4 py-3 text-left text-sm rounded-xl`}
                          >
                            <Flag className="h-4 w-4" />
                            Report User
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              )}
            </div>

            {/* Profile Details */}
            <div className="pt-20 text-center">
              <div className="flex items-center justify-center gap-3 mb-3 mt-5">
                <h1 className="text-3xl md:text-4xl font-bold text-white">@{profile.username}</h1>
              </div>

              {profile.bio && <p className="text-gray-300 text-lg mb-4 max-w-2xl mx-auto">{profile.bio}</p>}

              <div className="flex items-center justify-center gap-6 text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Joined {profile.created_at ? formatDate(profile.created_at) : "Unknown"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  <span className="text-sm">{uploads.length} uploads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">{favorites.length} favorites</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-xl p-1">
            {[
              { id: "uploads", label: "Uploads", count: uploads.length, icon: Grid3X3 },
              { id: "pairs", label: "Profile Pairs", count: profilePairs.length, icon: User },
              { id: "favorites", label: "Favorites", count: favorites.length, icon: Heart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={`text-xs px-2 py-1 rounded-full ${activeTab === tab.id ? "bg-gray-100 text-gray-600" : "bg-white/10 text-white/60"}`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-8">
          {activeTab === "uploads" && (
            <div>
              {uploads.length === 0 ? (
                <div className="text-center py-16">
                  <Grid3X3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No uploads yet</h3>
                  <p className="text-gray-400">
                    {isOwnProfile ? "You haven't uploaded anything yet." : "This user hasn't uploaded anything yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {uploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer hover:scale-105"
                    >
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={upload.image_url || "/placeholder.svg"}
                          alt={upload.title || "Upload image"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-1 truncate">{upload.title || "Untitled"}</h3>
                        <p className="text-sm text-gray-400 mb-2">{upload.category || "No category"}</p>
                        {upload.tags && upload.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {upload.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                            {upload.tags.length > 2 && (
                              <span className="text-xs text-gray-400">+{upload.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other tabs... */}
        </div>
      </div>

      {/* Report Modal with correct user ID */}
      <ReportModal
        isOpen={showReportModal}
        onClose={closeReportModal}
        reportedUserId={profile.user_id} // Use user_id instead of id
        reportedUsername={profile.username}
        reporterUserId={currentUserProfile?.user_id || ""}
        onReportSubmitted={handleReportSubmitted} />
    </div><Footer /></>
  )
}
