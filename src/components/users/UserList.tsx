"use client";

import useUserList from "@/hooks/users/use-user-list";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../Footer";

export default function UsersList() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading: loading } = useUserList();

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user) =>
      user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold mb-6">Members</h1>

          {/* Search Bar */}
          <div className="max-w-md">
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Search members"
            />
          </div>
        </div>

        {filteredUsers?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              {searchQuery
                ? "No members found matching your search."
                : "No members found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUsers?.map((user) => (
              <Link
                key={user.id}
                to={`/user/${user.username}`}
                className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 block"
                style={{ minHeight: "280px" }}
              >
                {/* Banner */}
                <div className="relative h-40">
                  {user.banner_url ? (
                    <img
                      src={user.banner_url || "/placeholder.svg"}
                      alt={`${user.username}'s banner`}
                      className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      <div className="text-white/30 text-sm font-medium">
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar - positioned half on banner, half off */}
                <div className="absolute top-28 left-1/2 transform -translate-x-1/2">
                  <img
                    src={
                      user.avatar_url ||
                      "/placeholder.svg?height=96&width=96&query=default+avatar"
                    }
                    alt={`${user.username}'s avatar`}
                    className="w-24 h-24 rounded-full border-4 border-purple-500 bg-slate-900 object-cover shadow-lg"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div className="pt-16 pb-6 px-6 text-center">
                  <h2 className="text-white font-semibold text-xl mb-2 truncate group-hover:text-purple-300 transition-colors">
                    @{user.username}
                  </h2>

                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
                    {user.bio || "No bio available"}
                  </p>

                  {/* Hover indicator */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="inline-flex items-center text-purple-400 text-sm font-medium">
                      View Profile
                      <svg
                        className="ml-1 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Link>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 text-center">
          <p className="text-slate-400">
            Showing {filteredUsers?.length || 0} of {users?.length || 0} members
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
