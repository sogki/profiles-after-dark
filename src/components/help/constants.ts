import {
  HelpCircle,
  Settings,
  Shield,
  Upload,
  User,
  Users,
} from "lucide-react";

export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

export const helpCategories = [
  { id: "getting-started", name: "Getting Started", icon: User, color: "text-blue-400" },
  { id: "uploading", name: "Uploading Content", icon: Upload, color: "text-green-400" },
  { id: "profile", name: "Profile Settings", icon: Settings, color: "text-purple-400" },
  { id: "community", name: "Community", icon: Users, color: "text-pink-400" },
  { id: "safety", name: "Safety & Privacy", icon: Shield, color: "text-red-400" },
  { id: "troubleshooting", name: "Troubleshooting", icon: HelpCircle, color: "text-yellow-400" },
] as const;

