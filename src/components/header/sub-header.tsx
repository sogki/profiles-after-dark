import { cn } from "@/lib/utils";
import {
  Users,
  UserIcon,
  ImageIcon,
  Layout,
  Smile,
  Sticker,
  TrendingUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

const subMenuList = [
  { id: "users", label: "Members", icon: Users, path: "/users" },
  {
    id: "profiles",
    label: "Profiles",
    icon: UserIcon,
    path: "/gallery/profiles",
  },
  { id: "pfps", label: "PFPs", icon: ImageIcon, path: "/gallery/pfps" },
  {
    id: "banners",
    label: "Profile Banners",
    icon: Layout,
    path: "/gallery/banners",
  },
  {
    id: "emoji-combos",
    label: "Emoji Combos",
    icon: Smile,
    path: "/gallery/emoji-combos",
  },
  { id: "emotes", label: "Emotes", icon: Sticker, path: "/gallery/emotes" },
  {
    id: "wallpapers",
    label: "Wallpapers",
    icon: ImageIcon,
    path: "/gallery/wallpapers",
  },
  { id: "trending", label: "Trending", icon: TrendingUp, path: "/trending" },
];

export type SubMenuProps = {
  showSubNav: boolean;
};

export default function SubHeader({ showSubNav }: SubMenuProps) {
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={`
        bg-muted/80 backdrop-blur-sm border-b border/50 sticky top-16 z-40
        transition-transform duration-300 ease-in-out
        ${showSubNav ? "translate-y-0" : "-translate-y-full"}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-6 overflow-x-auto no-scrollbar py-2">
          {subMenuList.map((item) => (
            <Button
              asChild
              key={item.id}
              variant={isActive(item.path) ? "default" : "ghost"}
              className={cn(
                !isActive("/users") ? "dark:hover:bg-background/50" : ""
              )}
            >
              <Link
                className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-all`}
                to={`${item.path}`}
              >
                <item.icon className="inline h-4 w-4 mr-1" />
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
