import { Link } from "react-router-dom"
import { Moon } from "lucide-react"

export default function Logo() {
  return (
    <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity group">
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
        <Moon className="h-8 w-8 text-white relative z-10 group-hover:text-purple-300 transition-colors" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
      </div>
      <div>
        <img
          src="https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles-after-dark-logomark.png"
          className="h-8 group-hover:scale-105 transition-transform duration-300"
          alt="Profiles After Dark logo"
        />
        <p className="text-xs text-slate-400 hidden sm:block group-hover:text-slate-300 transition-colors">
          Aesthetic profiles for the night owls
        </p>
      </div>
    </Link>
  )
}