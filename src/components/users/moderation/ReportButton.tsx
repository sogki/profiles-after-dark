import { Flag } from "lucide-react"

interface ReportButtonProps {
  onClick: () => void
  variant?: "default" | "icon" | "text"
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function ReportButton({ onClick, variant = "default", size = "md", className = "" }: ReportButtonProps) {
  const baseClasses =
    "flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"

  const variantClasses = {
    default: "bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium",
    icon: "p-2 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-lg",
    text: "text-red-400 hover:text-red-300 underline",
  }

  const sizeClasses = {
    sm: variant === "default" ? "px-3 py-2 text-sm" : "text-sm",
    md: variant === "default" ? "px-4 py-2" : "",
    lg: variant === "default" ? "px-6 py-3 text-lg" : "text-lg",
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      <Flag className={`${size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5"}`} />
      {variant !== "icon" && "Report"}
    </button>
  )
}
