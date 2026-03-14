import { Dialog, Transition } from "@headlessui/react";
import { Users, UserPlus, X } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router-dom";

interface FollowUser {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

interface FollowItem {
  user?: FollowUser | null;
}

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "followers" | "following";
  loading: boolean;
  followList: FollowItem[];
}

export default function FollowListModal({
  isOpen,
  onClose,
  type,
  loading,
  followList,
}: FollowListModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 modal-backdrop-light" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden modal-popup-shell">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                      {type === "followers" ? (
                        <>
                          <Users className="h-5 w-5 text-purple-400" />
                          Followers
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5 text-purple-400" />
                          Following
                        </>
                      )}
                    </Dialog.Title>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    </div>
                  ) : followList.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-400">No {type === "followers" ? "followers" : "following"} yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {followList.map(
                        (item) =>
                          item.user && (
                            <Link
                              key={item.user.user_id}
                              to={`/user/${item.user.username}`}
                              onClick={onClose}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors group"
                            >
                              <img
                                src={item.user.avatar_url || "/placeholder.svg"}
                                alt={item.user.display_name || item.user.username}
                                className="w-12 h-12 rounded-full object-cover border-2 border-slate-600 group-hover:border-purple-500 transition-colors"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{item.user.display_name || item.user.username}</p>
                                <p className="text-sm text-slate-400 truncate">@{item.user.username}</p>
                              </div>
                            </Link>
                          ),
                      )}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

