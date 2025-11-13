import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { Loader2, Download, Database, HardDrive, Image, FileImage, Smile, Monitor, Upload } from "lucide-react"
import toast from "react-hot-toast"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface DataSettingsProps {
  user: SupabaseUser | null
  loading: boolean
  setLoading: (loading: boolean) => void
}

type StorageUsage = {
  profiles: { count: number; size: number }
  emotes: { count: number; size: number }
  wallpapers: { count: number; size: number }
  emojiCombos: { count: number; size: number }
  total: { count: number; size: number }
}

export default function DataSettings({ user, loading, setLoading }: DataSettingsProps) {
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null)
  const [loadingStorage, setLoadingStorage] = useState(false)
  const [backupFile, setBackupFile] = useState<File | null>(null)

  useEffect(() => {
    if (user) {
      fetchStorageUsage()
    }
  }, [user])

  const fetchStorageUsage = async () => {
    if (!user) return
    setLoadingStorage(true)
    try {
      // Fetch counts for each content type
      const [profilesRes, emotesRes, wallpapersRes, emojiCombosRes] = await Promise.all([
        supabase.from("profiles").select("id, image_url", { count: "exact" }).eq("user_id", user.id),
        supabase.from("emotes").select("id, image_url", { count: "exact" }).eq("user_id", user.id),
        supabase.from("wallpapers").select("id, image_url", { count: "exact" }).eq("user_id", user.id),
        supabase.from("emoji_combos").select("id", { count: "exact" }).eq("user_id", user.id),
      ])

      // Calculate approximate sizes (we can't get exact file sizes without storage API)
      // For now, we'll estimate based on content type
      const profilesCount = profilesRes.count || 0
      const emotesCount = emotesRes.count || 0
      const wallpapersCount = wallpapersRes.count || 0
      const emojiCombosCount = emojiCombosRes.count || 0

      // Rough estimates: profiles ~500KB, emotes ~50KB, wallpapers ~2MB, emoji combos ~1KB
      const profilesSize = profilesCount * 500 * 1024
      const emotesSize = emotesCount * 50 * 1024
      const wallpapersSize = wallpapersCount * 2 * 1024 * 1024
      const emojiCombosSize = emojiCombosCount * 1024

      const totalCount = profilesCount + emotesCount + wallpapersCount + emojiCombosCount
      const totalSize = profilesSize + emotesSize + wallpapersSize + emojiCombosSize

      setStorageUsage({
        profiles: { count: profilesCount, size: profilesSize },
        emotes: { count: emotesCount, size: emotesSize },
        wallpapers: { count: wallpapersCount, size: wallpapersSize },
        emojiCombos: { count: emojiCombosCount, size: emojiCombosSize },
        total: { count: totalCount, size: totalSize },
      })
    } catch (error) {
      console.error("Failed to fetch storage usage:", error)
    } finally {
      setLoadingStorage(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const createBackup = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Get all user data in parallel
      const [
        profileData,
        profilesData,
        profilePairsData,
        emotesData,
        wallpapersData,
        emojiCombosData,
        favoritesData,
        followsData,
        followersData,
        notificationsData,
        downloadsData
      ] = await Promise.all([
        // User profile
        supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        // Uploaded profiles
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id),
        // Profile pairs
        supabase
          .from("profile_pairs")
          .select("*")
          .eq("user_id", user.id),
        // Emotes
        supabase
          .from("emotes")
          .select("*")
          .eq("user_id", user.id),
        // Wallpapers
        supabase
          .from("wallpapers")
          .select("*")
          .eq("user_id", user.id),
        // Emoji combos
        supabase
          .from("emoji_combos")
          .select("*")
          .eq("user_id", user.id),
        // Favorites
        supabase
          .from("favorites")
          .select("*")
          .eq("user_id", user.id),
        // Follows (users this user follows)
        supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user.id),
        // Followers (users who follow this user)
        supabase
          .from("follows")
          .select("*")
          .eq("following_id", user.id),
        // Notifications
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1000), // Limit to last 1000 notifications
        // Downloads
        supabase
          .from("downloads")
          .select("*")
          .eq("user_id", user.id)
      ])

      // Try to get single_uploads if table exists
      let singleUploadsData = null
      try {
        const { data } = await supabase
          .from("single_uploads")
          .select("*")
          .eq("user_id", user.id)
        singleUploadsData = data
      } catch (e) {
        // Table might not exist, ignore
      }

      const backupData = {
        version: "2.0",
        createdAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
        },
        settings: {
          theme: localStorage.getItem("theme") || "dark",
          privacy: localStorage.getItem("privacy_settings") || "{}",
        },
        profile: profileData?.data || {},
        content: {
          profiles: profilesData?.data || [],
          profilePairs: profilePairsData?.data || [],
          emotes: emotesData?.data || [],
          wallpapers: wallpapersData?.data || [],
          emojiCombos: emojiCombosData?.data || [],
          singleUploads: singleUploadsData || [],
        },
        social: {
          favorites: favoritesData?.data || [],
          follows: followsData?.data || [],
          followers: followersData?.data || [],
        },
        activity: {
          notifications: notificationsData?.data || [],
          downloads: downloadsData?.data || [],
        },
        summary: {
          totalContent: (profilesData?.data?.length || 0) +
                       (profilePairsData?.data?.length || 0) +
                       (emotesData?.data?.length || 0) +
                       (wallpapersData?.data?.length || 0) +
                       (emojiCombosData?.data?.length || 0) +
                       (singleUploadsData?.length || 0),
          totalFavorites: favoritesData?.data?.length || 0,
          totalFollows: followsData?.data?.length || 0,
          totalFollowers: followersData?.data?.length || 0,
        }
      }

      // Save to database
      const { error: dbError } = await supabase
        .from("account_backups")
        .insert({
          user_id: user.id,
          backup_data: backupData,
          version: "2.0",
        })

      if (dbError) {
        console.error("Failed to save backup to database:", dbError)
        // Continue with file download even if DB save fails
      }

      // Also download as file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `account-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Log backup downloaded
      await supabase.from('moderation_logs').insert({
        moderator_id: user.id,
        target_user_id: user.id,
        action: 'backup_downloaded',
        title: 'Account Backup Downloaded',
        description: 'User downloaded account backup file'
      }).catch(err => console.warn('Failed to log backup download:', err))

      toast.success("Account backup created and saved successfully!")
    } catch (error) {
      console.error("Backup error:", error)
      toast.error("Failed to create backup")
    } finally {
      setLoading(false)
    }
  }

  const restoreBackup = async () => {
    if (!backupFile || !user) return
    setLoading(true)
    try {
      const text = await backupFile.text()
      const backupData = JSON.parse(text)

      if (!backupData.version || !backupData.settings) {
        throw new Error("Invalid backup file format")
      }

      // Restore settings
      if (backupData.settings.theme) {
        localStorage.setItem("theme", backupData.settings.theme)
      }
      if (backupData.settings.privacy) {
        localStorage.setItem("privacy_settings", backupData.settings.privacy)
      }

      // Update restored_at in account_backups if we can find the backup
      if (backupData.user?.id) {
        await supabase
          .from('account_backups')
          .update({ restored_at: new Date().toISOString() })
          .eq('user_id', backupData.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .catch(err => console.warn('Failed to update backup restored_at:', err))
      }

      // Log backup restored
      await supabase.from('moderation_logs').insert({
        moderator_id: user.id,
        target_user_id: user.id,
        action: 'backup_restored',
        title: 'Account Backup Restored',
        description: 'User restored account from backup file'
      }).catch(err => console.warn('Failed to log backup restore:', err))

      toast.success("Account backup restored successfully! Please refresh the page to see changes.")
      setBackupFile(null)
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      toast.error("Failed to restore backup. Please check the file format.")
      console.error("Restore error:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Fetch all user data
      const [profileData, favoritesData, uploadsData] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("favorites").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("user_id", user.id),
      ])

      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profileData.data,
        favorites: favoritesData.data || [],
        uploads: uploadsData.data || [],
        settings: {
          theme: localStorage.getItem("theme"),
          privacy: localStorage.getItem("privacy_settings"),
        },
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `profile-data-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Data exported successfully!")
    } catch (error) {
      toast.error("Failed to export data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Data Export */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <Download className="h-5 w-5 text-purple-400" />
          Data Export
        </h3>

        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/30">
          <p className="text-slate-300 mb-4">
            Download a copy of all your data including profile information, settings, and activity history.
          </p>
          <button
            onClick={exportData}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium text-white transition-colors"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Download className="h-5 w-5 text-white" />}
            Export My Data
          </button>
        </div>
      </div>

      {/* Account Backup */}
      <div className="border-t border-slate-700 pt-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <Database className="h-5 w-5 text-green-400" />
          Account Backup
        </h3>

        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/30 space-y-4">
          <p className="text-slate-300 text-sm mb-4">
            Create a comprehensive backup of your account including profile, all uploaded content, favorites, follows, and activity history.
          </p>
          
          <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
            <p className="text-xs text-slate-400 mb-2">Backup includes:</p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>Profile information and settings</li>
              <li>All uploaded content (profiles, pairs, emotes, wallpapers, emoji combos)</li>
              <li>Favorites and saved items</li>
              <li>Follows and followers</li>
              <li>Recent notifications and download history</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={createBackup}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium text-white transition-colors"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              Create Backup
            </button>

            <label className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 cursor-pointer px-6 py-3 rounded-lg font-medium text-white transition-colors">
              <Upload className="h-5 w-5" />
              Restore Backup
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setBackupFile(file)
                    restoreBackup()
                  }
                }}
              />
            </label>
          </div>

          {backupFile && (
            <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-sm text-blue-300">Selected: {backupFile.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Storage Usage */}
      <div className="border-t border-slate-700 pt-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <HardDrive className="h-5 w-5 text-purple-400" />
          Storage Usage
        </h3>

        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/30">
          {loadingStorage ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : storageUsage ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Image className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Profile Pairs</p>
                    <p className="text-lg font-semibold text-white">{storageUsage.profiles.count}</p>
                    <p className="text-xs text-slate-500">{formatBytes(storageUsage.profiles.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Smile className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Emotes</p>
                    <p className="text-lg font-semibold text-white">{storageUsage.emotes.count}</p>
                    <p className="text-xs text-slate-500">{formatBytes(storageUsage.emotes.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <Monitor className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Wallpapers</p>
                    <p className="text-lg font-semibold text-white">{storageUsage.wallpapers.count}</p>
                    <p className="text-xs text-slate-500">{formatBytes(storageUsage.wallpapers.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <div className="p-2 bg-yellow-600/20 rounded-lg">
                    <FileImage className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Emoji Combos</p>
                    <p className="text-lg font-semibold text-white">{storageUsage.emojiCombos.count}</p>
                    <p className="text-xs text-slate-500">{formatBytes(storageUsage.emojiCombos.size)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Storage</p>
                    <p className="text-2xl font-bold text-white">{formatBytes(storageUsage.total.size)}</p>
                    <p className="text-xs text-slate-500 mt-1">{storageUsage.total.count} items total</p>
                  </div>
                  <HardDrive className="h-12 w-12 text-purple-400 opacity-50" />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Unable to load storage usage</p>
          )}
        </div>
      </div>
    </div>
  )
}

