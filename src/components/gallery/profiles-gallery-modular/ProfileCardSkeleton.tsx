export default function ProfileCardSkeleton({ viewMode }: { viewMode: "list" | "grid" }) {
  return (
    <div className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl animate-pulse">
      <div className={`w-full ${viewMode === "list" ? "h-32" : "h-40"} bg-gray-700`} />
      {viewMode === "grid" && (
        <div className="w-24 h-24 bg-gray-700 rounded-full border-4 border-gray-800 absolute top-28 left-1/2 transform -translate-x-1/2" />
      )}
      <div className={`pt-${viewMode === "list" ? "4" : "20"} pb-6 px-6 text-center space-y-3`}>
        <div className="h-6 bg-gray-700 rounded mx-auto w-3/4" />
        <div className="flex justify-center gap-2">
          <div className="h-5 bg-gray-700 rounded w-12" />
          <div className="h-5 bg-gray-700 rounded w-16" />
        </div>
        <div className="flex justify-center gap-5 pt-2">
          <div className="h-8 w-8 bg-gray-700 rounded" />
          <div className="h-8 w-8 bg-gray-700 rounded" />
          <div className="h-8 w-8 bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  )
}