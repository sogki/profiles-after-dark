import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Download, Eye, Heart } from "lucide-react";
import { LookupTables, type GalleryItemProps } from "./common-types";

export default function GalleryListView<T extends LookupTables>({
  item,
  rawData,
  handleFavorite,
  openPreview,
  handleDownloadBoth,
}: GalleryItemProps<T>) {
  return (
    <div
      key={item?.id}
      className={cn(
        "relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 border  backdrop-blur-sm pt-0 group flex"
      )}
      style={{ minHeight: "280px" }}
    >
      {/* Banner Display */}
      <div className={"relative overflow-hidden w-full h-40"}>
        <img
          src={item?.banner_url || "/placeholder.svg"}
          alt={`${item?.title} banner`}
          className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all duration-300"
          loading="lazy"
        />

        {/* Stats Overlay */}
        <div className="absolute top-3 right-3 flex gap-2">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <Download className="h-3 w-3 text-green-400" />
            <span className="text-xs text-gray-300">
              {item?.download_count || 0}
            </span>
          </div>
          {item.category && (
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              <span className="text-xs text-purple-300 font-medium">
                {item.category}
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className={"pt-11 px-6 h-full text-center flex flex-col justify-center"}
      >
        <div className={"text-center"}>
          <h3
            className={cn("text-white font-semibold mb-3", "text-xl truncate")}
          >
            {item.title}
          </h3>

          <div className="flex flex-wrap justify-center gap-1 mb-4 max-h-16 overflow-auto px-2">
            {(item.tags || []).map((tag) => (
              <Badge variant="gradient" key={tag}>
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button
          onClick={() => openPreview(rawData)}
          variant="outline"
          aria-label={`Preview ${item?.title}`}
          type="button"
        >
          <Eye size={16} />
          Preview
        </Button>

        <Button
          onClick={() => handleDownloadBoth(rawData)}
          aria-label={`Download ${item?.title} combo`}
          type="button"
        >
          <Download size={16} />
          Download
        </Button>

        {item?.user && (
          <Button
            onClick={() => handleFavorite(item.id)}
            variant={item.favorites?.has(item.id) ? "destructive" : "outline"}
            size="icon"
            aria-pressed={item?.favorites.has(item.id)}
            aria-label={
              item?.favorites.has(item.id)
                ? `Remove ${item.title} from favorites`
                : `Add ${item.title} to favorites`
            }
            type="button"
          >
            <Heart
              size={16}
              fill={item?.favorites.has(item.id) ? "currentColor" : "none"}
            />
          </Button>
        )}
      </div>
    </div>
  );
}
