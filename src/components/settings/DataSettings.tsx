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
      // Get profile data
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("username, display_name, bio, avatar_url, banner_url")
        .eq("user_id", user.id)
        .single()

      const backupData = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        settings: {
          theme: localStorage.getItem("theme") || "dark",
          privacy: localStorage.getItem("privacy_settings") || "{}",
        },
        profile: profileData || {},
      }

      // Save to database
      const { error: dbError } = await supabase
        .from("account_backups")
        .insert({
          user_id: user.id,
          backup_data: backupData,
          version: "1.0",
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
          <p className="text-slate-300 text-sm">
            Create a backup of your account settings and preferences. This can be used to restore your account configuration.
          </p>

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

