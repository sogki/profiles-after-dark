import { Loader2, Info } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface AppearanceSettingsProps {
  user: SupabaseUser | null
  loading: boolean
  setLoading: (loading: boolean) => void
  selectedTheme: string
  setSelectedTheme: (theme: string) => void
}

export default function AppearanceSettings({
  user,
  loading,
  setLoading,
  selectedTheme,
  setSelectedTheme,
}: AppearanceSettingsProps) {
  return (
    <div className="space-y-5">
      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/30">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600/20 rounded-lg">
            <Info className="h-6 w-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Appearance Settings</h3>
            <p className="text-slate-300 text-sm mb-4">
              Theme customization is not currently available. The website uses a consistent dark theme across all pages.
            </p>
            <p className="text-slate-400 text-xs">
              If you'd like to see theme options in the future, please submit a feature request through the Support tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

