import { useRef, useState } from "react"
import { supabase } from "../../lib/supabase"
import { Loader2, Save, Camera, Upload, User } from "lucide-react"
import toast from "react-hot-toast"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type Profile = {
  username: string
  display_name: string
  bio: string
  avatar_url: string
  banner_url: string
}

interface AccountSettingsProps {
  profile: Profile
  setProfile: (profile: Profile | ((prev: Profile) => Profile)) => void
  user: SupabaseUser | null
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function AccountSettings({
  profile,
  setProfile,
  user,
  loading,
  setLoading,
}: AccountSettingsProps) {
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const usernameInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "avatar_url" | "banner_url") => {
    const file = e.target.files?.[0]
    if (!file) {
      toast.error("No file selected.")
      return
    }

    if (!user) {
      toast.error("User not authenticated.")
      return
    }

    const isAvatar = field === "avatar_url"
    isAvatar ? setUploadingAvatar(true) : setUploadingBanner(true)

    const bucket = isAvatar ? "avatars" : "banners"
    const filePath = `${user.id}/${field}-${Date.now()}-${file.name}`

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      if (!publicUrl) throw new Error("No public URL returned.")

      setProfile((prev) => ({ ...prev, [field]: publicUrl }))

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ [field]: publicUrl })
        .eq("user_id", user.id)

      if (updateError) {
        console.error(updateError)
        throw updateError
      }

      toast.success(`${isAvatar ? "Avatar" : "Banner"} uploaded successfully.`)
    } catch (error: any) {
      console.error("Upload Error:", error)
      toast.error(error?.message || "Failed to upload file.")
    } finally {
      isAvatar ? setUploadingAvatar(false) : setUploadingBanner(false)
      e.target.value = ""
    }
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    const { error } = await supabase.from("user_profiles").update(profile).eq("user_id", user.id)

    if (error) {
      toast.error("Failed to update profile.")
    } else {
      toast.success("Profile updated successfully.")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      {/* Profile Header */}
      <div className="relative">
        {/* Banner */}
        <div
          className="relative h-32 sm:h-40 bg-slate-800/50 rounded-xl cursor-pointer group overflow-hidden border border-slate-700/30"
          onClick={() => bannerInputRef.current?.click()}
        >
          {uploadingBanner && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          {profile.banner_url ? (
            <img
              src={profile.banner_url || "/placeholder.svg"}
              alt="Banner"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto mb-2" />
                <p>Click to upload banner</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-sm">
            <div className="text-center text-white">
              <Camera className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Change Banner</p>
            </div>
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
          className="absolute left-4 sm:left-6 -bottom-12 sm:-bottom-16 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-slate-800 bg-slate-800/50 cursor-pointer group overflow-hidden shadow-lg flex items-center justify-center transition-transform duration-300 hover:scale-105"
        >
          {uploadingAvatar && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-full">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url || "/placeholder.svg"}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="h-16 w-16 text-slate-400" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity duration-300 backdrop-blur-sm">
            <Camera className="text-white h-6 w-6" />
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
      <div className="pt-16 sm:pt-20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Username</label>
            <input
              ref={usernameInputRef}
              type="text"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Display Name</label>
            <input
              type="text"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter display name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Bio</label>
          <textarea
            rows={4}
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="w-full bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
            placeholder="Tell us about yourself..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors text-white"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Save Profile
        </button>
      </div>
    </div>
  )
}

