import { useRef, useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { getConfig } from "../../lib/config"
import { Loader2, Save, Camera, Upload, User, Link2, Copy, Check } from "lucide-react"
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
  const [linkingCode, setLinkingCode] = useState<string | null>(null)
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [isLinked, setIsLinked] = useState(false)
  const [discordAccount, setDiscordAccount] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Check linking status on mount
  useEffect(() => {
    if (user) {
      checkLinkingStatus()
    }
  }, [user])

  // Set up real-time subscription for account linking
  useEffect(() => {
    if (!user) return

    // Subscribe to discord_users table updates and inserts
    const discordChannel = supabase
      .channel(`account-linking-discord-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discord_users',
          filter: `web_user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Account linking update:', payload)
          if (payload.new.web_user_id === user.id && payload.new.discord_id) {
            setIsLinked(true)
            setDiscordAccount({
              discord_id: payload.new.discord_id,
              username: payload.new.username,
              avatar_url: payload.new.avatar_url
            })
            setLinkingCode(null)
            setCodeExpiresAt(null)
            toast.success('Discord account linked successfully!')
            // Refresh status to get latest data
            checkLinkingStatus()
          }
        }
      )
      .subscribe()

    // Subscribe to notifications for account_linked type
    const notificationChannel = supabase
      .channel(`account-linking-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as any
          if (notification.type === 'account_linked') {
            toast.success('Discord account linked successfully!')
            checkLinkingStatus()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(discordChannel)
      supabase.removeChannel(notificationChannel)
    }
  }, [user])

  const checkLinkingStatus = async () => {
    if (!user) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const config = await getConfig()
      const API_URL = config.API_URL || config.VITE_API_URL || 'http://localhost:3000'
      const apiBaseUrl = API_URL.replace('/api/v1', '').replace('/api', '')

      const response = await fetch(`${apiBaseUrl}/api/v1/account-linking/status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setIsLinked(result.data.is_linked)
          setDiscordAccount(result.data.discord_account)
          if (result.data.has_active_code) {
            setLinkingCode(result.data.active_code.code)
            setCodeExpiresAt(result.data.active_code.expires_at)
          }
        }
      }
    } catch (error) {
      console.error('Error checking linking status:', error)
    }
  }

  const generateLinkingCode = async () => {
    if (!user) {
      toast.error('You must be logged in to generate a linking code.')
      return
    }

    setIsGeneratingCode(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Session expired. Please log in again.')
        return
      }

      const config = await getConfig()
      const API_URL = config.API_URL || config.VITE_API_URL || 'http://localhost:3000'
      const apiBaseUrl = API_URL.replace('/api/v1', '').replace('/api', '')

      const response = await fetch(`${apiBaseUrl}/api/v1/account-linking/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setLinkingCode(result.data.code)
        setCodeExpiresAt(result.data.expires_at)
        toast.success('Linking code generated! Use /sync in Discord to link your account.')
      } else {
        toast.error(result.error || 'Failed to generate linking code.')
      }
    } catch (error) {
      console.error('Error generating linking code:', error)
      toast.error('Failed to generate linking code. Please try again.')
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const copyCode = () => {
    if (linkingCode) {
      navigator.clipboard.writeText(linkingCode)
      setCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isCodeExpired = () => {
    if (!codeExpiresAt) return false
    return new Date(codeExpiresAt) < new Date()
  }

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
    try {
      // Get previous values before updating
      const { data: previousProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      const { error } = await supabase.from("user_profiles").update(profile).eq("user_id", user.id)

      if (error) {
        toast.error("Failed to update profile.")
      } else {
        // Log the account update with before/after values
        const changes: Record<string, { before: any; after: any }> = {}
        if (previousProfile) {
          Object.keys(profile).forEach(key => {
            const beforeValue = previousProfile[key as keyof typeof previousProfile]
            const afterValue = profile[key as keyof typeof profile]
            if (beforeValue !== afterValue) {
              changes[key] = { before: beforeValue, after: afterValue }
            }
          })
        }

        // Log to moderation_logs if there are changes
        if (Object.keys(changes).length > 0) {
          await supabase.from('moderation_logs').insert({
            moderator_id: user.id,
            target_user_id: user.id,
            action: 'account_updated',
            title: 'Account Updated',
            description: `Account profile updated: ${Object.keys(changes).join(', ')}`,
            metadata: {
              changes: changes,
              previous_profile: previousProfile,
              new_profile: profile
            }
          }).catch(err => console.warn('Failed to log account update:', err))
        }

        toast.success("Profile updated successfully.")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Failed to update profile.")
    } finally {
      setLoading(false)
    }
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

        {/* Discord Account Linking Section */}
        <div className="mt-8 pt-8 border-t border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Discord Account Linking
          </h3>

          {isLinked ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 font-medium mb-1">✅ Account Linked</p>
                  <p className="text-slate-300 text-sm">
                    Your Discord account <span className="font-mono text-white">{discordAccount?.username || 'Unknown'}</span> is linked to this account.
                  </p>
                </div>
                {discordAccount?.avatar_url && (
                  <img 
                    src={discordAccount.avatar_url} 
                    alt="Discord Avatar" 
                    className="w-12 h-12 rounded-full"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {linkingCode && !isCodeExpired() ? (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-sm text-slate-300 mb-3">
                    Use this code in Discord with <span className="font-mono bg-slate-800 px-2 py-1 rounded">/sync {linkingCode}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Your Linking Code</p>
                      <p className="text-2xl font-mono font-bold text-white tracking-wider">{linkingCode}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Expires: {new Date(codeExpiresAt!).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={copyCode}
                      className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
                      title="Copy code"
                    >
                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    ⏱️ This code expires in 15 minutes and can only be used once.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-300 text-sm mb-4">
                    Link your Discord account to unlock additional features and sync your data across platforms.
                  </p>
                  <button
                    onClick={generateLinkingCode}
                    disabled={isGeneratingCode}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors text-white"
                  >
                    {isGeneratingCode ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating Code...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-5 w-5" />
                        Generate Linking Code
                      </>
                    )}
                  </button>
                  {linkingCode && isCodeExpired() && (
                    <p className="text-xs text-red-400 mt-2">
                      ⚠️ Your previous code has expired. Generate a new one to continue.
                    </p>
                  )}
                </div>
              )}

              <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2 font-semibold">How to link:</p>
                <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Click "Generate Linking Code" above</li>
                  <li>Copy the 8-character code</li>
                  <li>Open Discord and run <span className="font-mono text-white">/sync [code]</span></li>
                  <li>You'll receive a confirmation notification when linked!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

