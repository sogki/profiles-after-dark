import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { Loader2, Save, Mail, Lock, Eye, EyeOff, History, AlertTriangle, Trash2, Smartphone, Monitor, MapPin } from "lucide-react"
import toast from "react-hot-toast"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useNavigate } from "react-router-dom"

type LoginSession = {
  id: string
  device: string
  location: string
  ip_address: string
  last_active: string
  current: boolean
}

interface SecuritySettingsProps {
  user: SupabaseUser | null
  email: string
  setEmail: (email: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  loginSessions: LoginSession[]
}

export default function SecuritySettings({
  user,
  email,
  setEmail,
  loading,
  setLoading,
  loginSessions,
}: SecuritySettingsProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  const updateEmailPassword = async () => {
    if (!user) return

    if (password && password !== confirmPassword) {
      toast.error("Passwords don't match.")
      return
    }

    setLoading(true)

    try {
      if (email && email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email })
        if (error) throw error
        toast.success("Email updated successfully.")
      }

      if (password) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        toast.success("Password updated successfully.")
      }
    } catch (error) {
      toast.error("Failed to update email or password.")
    } finally {
      setLoading(false)
      setPassword("")
      setConfirmPassword("")
    }
  }

  const handleDeleteAccount = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      toast.error("No user logged in.")
      return
    }

    // Log account deletion started
    await supabase.from('moderation_logs').insert({
      moderator_id: currentUser.id,
      target_user_id: currentUser.id,
      action: 'account_deletion_started',
      title: 'Account Deletion Started',
      description: 'User initiated account deletion process'
    }).catch(err => console.warn('Failed to log deletion start:', err))

    if (!confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
      // Log account deletion cancelled
      await supabase.from('moderation_logs').insert({
        moderator_id: currentUser.id,
        target_user_id: currentUser.id,
        action: 'account_deletion_cancelled',
        title: 'Account Deletion Cancelled',
        description: 'User cancelled account deletion process'
      }).catch(err => console.warn('Failed to log deletion cancel:', err))
      return
    }

    setIsDeleting(true)
    try {
      const { error } = await supabase.rpc("delete_user_account", {
        uid: currentUser.id,
      })

      if (error) {
        toast.error(`Failed to delete account: ${error.message}`)
        setIsDeleting(false)
        return
      }

      // Log account deleted (this might not execute if account is deleted, but try anyway)
      await supabase.from('moderation_logs').insert({
        moderator_id: currentUser.id,
        target_user_id: currentUser.id,
        action: 'account_deleted',
        title: 'Account Deleted',
        description: 'User account was successfully deleted'
      }).catch(err => console.warn('Failed to log deletion:', err))

      toast.success("Your account has been deleted successfully.")
      await supabase.auth.signOut()
      navigate("/")
    } catch (error: any) {
      toast.error("An unexpected error occurred.")
      console.error("Delete account error:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Email & Password */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 pl-10 pr-12 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 pl-10 pr-12 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={updateEmailPassword}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium text-white transition-colors"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Update Security Settings
        </button>
      </div>

      {/* Login Activity */}
      <div className="border-t border-slate-700 pt-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <History className="h-5 w-5 text-green-400" />
          Login Activity
        </h3>

        <div className="space-y-3">
          {loginSessions.length > 0 ? (
            loginSessions.map((session) => (
              <div key={session.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg border border-purple-500/20">
                    {session.device.includes("iPhone") || session.device.includes("iOS") || session.device.includes("Android") ? (
                      <Smartphone className="h-5 w-5" />
                    ) : (
                      <Monitor className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{session.device}</p>
                    {session.location !== "Unknown" && session.ip_address !== "Unknown" && (
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location} • {session.ip_address}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {session.current ? "Current session" : `Last active: ${new Date(session.last_active).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.current && (
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                      Current
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-400 text-sm">No active sessions found</p>
              <p className="text-slate-500 text-xs mt-1">Session tracking will be available soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-slate-700 pt-5">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
          </div>
          <p className="text-slate-300 mb-4">
            Deleting your account is permanent and will remove all your data. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium text-white transition-colors"
          >
            {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            {isDeleting ? "Deleting Account..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  )
}

