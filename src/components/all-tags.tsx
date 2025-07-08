import { Tag } from "lucide-react";

import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export type AllTagsProps = {
  allTags: string[];
  selectedTags: Set<string>;
  toggleTag: (tag: string) => void;
  setSelectedTags: (tags: Set<string>) => void;
};

export default function AllTags({
  allTags,
  selectedTags,
  setSelectedTags,
  toggleTag,
}: AllTagsProps) {
  return (
    allTags.length > 0 && (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Tag className="h-4 w-4 bg-primary/40" />
            </div>
            <span className="text-lg font-semibold text-white">
              Filter by tags
            </span>
          </div>
          {selectedTags.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-slate-400">
                {selectedTags.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTags(new Set())}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {allTags.slice(0, 20).map((tag) => (
            <Button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "rounded-xl",
                selectedTags.has(tag)
                  ? "ring ring-primary bg-gradient-to-r from-primary/30 to-primary/90 hover:from-primary/20 hover:to-primary/50"
                  : ""
              )}
              variant={"tagGradient"}
            >
              #{tag}
            </Button>
          ))}
          {allTags.length > 20 && (
            <div className="px-4 py-2 text-sm bg-popover rounded-xl border border-input">
              +{allTags.length - 20} more tags
            </div>
          )}
        </div>
      </div>
    )
  );
}
