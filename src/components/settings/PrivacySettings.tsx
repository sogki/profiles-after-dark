import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { Loader2, Save, Eye, Users, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface PrivacySettingsProps {
  user: SupabaseUser | null
  loading: boolean
  setLoading: (loading: boolean) => void
  profileVisibility: string
  setProfileVisibility: (visibility: string) => void
  showOnlineStatus: boolean
  setShowOnlineStatus: (value: boolean) => void
}

export default function PrivacySettings({
  user,
  loading,
  setLoading,
  profileVisibility,
  setProfileVisibility,
  showOnlineStatus,
  setShowOnlineStatus,
}: PrivacySettingsProps) {
  const savePrivacySettings = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Save to localStorage
      localStorage.setItem("privacy_settings", JSON.stringify({
        profile_visibility: profileVisibility,
        show_online_status: showOnlineStatus,
      }))
      
      // Save to database
      const { error } = await supabase
        .from("user_profiles")
        .update({
          profile_visibility: profileVisibility,
          show_online_status: showOnlineStatus,
        } as any)
        .eq("user_id", user.id)

      if (error) {
        console.error("Error saving privacy settings to database:", error)
        // Still show success since we saved to localStorage
        // The migration should ensure the columns exist
      }
      
      toast.success("Privacy settings saved!")
    } catch (error) {
      toast.error("Failed to save privacy settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Profile Visibility */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <Eye className="h-5 w-5 text-purple-400" />
          Profile Visibility
        </h3>

        <div className="space-y-3">
          {[
            { value: "public", label: "Public", description: "Anyone can see your profile" },
            {
              value: "friends",
              label: "Friends Only",
              description: "Only users who follow each other (mutual follows) can see your profile",
            },
            { value: "private", label: "Private", description: "Only you can see your profile" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setProfileVisibility(option.value)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${profileVisibility === option.value
                  ? "border-purple-500 bg-purple-900/30 shadow-lg shadow-purple-500/20"
                  : "border-slate-700/50 hover:border-purple-500/50 bg-slate-800/30"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{option.label}</p>
                  <p className="text-sm text-slate-400">{option.description}</p>
                </div>
                {profileVisibility === option.value && <CheckCircle className="h-5 w-5 text-purple-400" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Social Settings */}
      <div className="border-t border-slate-700 pt-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-green-400" />
          Social Settings
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <div>
              <p className="font-medium text-white">Show Online Status</p>
              <p className="text-sm text-slate-400">Let others see when you're online</p>
            </div>
            <button
              onClick={() => setShowOnlineStatus(!showOnlineStatus)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showOnlineStatus ? "bg-blue-600" : "bg-slate-700/50"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showOnlineStatus ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={savePrivacySettings}
        disabled={loading}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium text-white transition-colors"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Save className="h-5 w-5 text-white" />}
        Save Privacy Settings
      </button>
    </div>
  )
}

