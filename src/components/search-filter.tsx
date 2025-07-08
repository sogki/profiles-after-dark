import { Grid3X3, List, Palette, X } from "lucide-react";
import AllTags, { AllTagsProps } from "./all-tags";
import SearchNew from "./search-new";
import { Label } from "./ui/label";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export type SearchFilterProps = AllTagsProps & {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedColor: string | "all";
  setSelectedColor: (color: string | "all") => void;
  viewMode: "grid" | "list";
  allTags: string[];
  allColors: string[];
  filteredAmount: number;
  placeholder?: string;
  totalAmount: number;
  setViewMode: (mode: "grid" | "list") => void;
};

export default function SearchFilter({
  searchQuery,
  setSearchQuery,
  selectedTags,
  placeholder = "Search...",
  setSelectedTags,
  selectedColor,
  toggleTag,
  setSelectedColor,
  viewMode,
  setViewMode,
  allTags,
  filteredAmount,
  totalAmount,
  allColors,
}: SearchFilterProps) {
  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-slate-600/50 shadow-2xl">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <SearchNew
            inputClassName="h-15 px-4 text-lg pe-5 pr-6 pl-12 mb-6"
            searchIconClassName="ps-3"
            leftIcon={{
              className: "pe-3",
              icon: <X size={25} />,
              onLeftIconClick: () => setSearchQuery(""),
              showLeftIcon: !!searchQuery,
            }}
            value={searchQuery}
            searchIconSize={25}
            onChange={(e) => setSearchQuery(e.target.value)}
            submitIconSize={25}
            searchPlaceholder={placeholder}
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Color Filter */}
        {allColors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Palette className="inline h-4 w-4 mr-1" />
              Color
            </label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
            >
              <option value="all">All Colors</option>
              {allColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* View Mode */}

        <div>
          <Label className="block text-sm font-medium text-muted-foreground mb-2">
            View Mode
          </Label>{" "}
          <ToggleGroup
            className="inline-flex bg-muted border gap-3"
            type="single"
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "grid" | "list")}
          >
            <ToggleGroupItem value="grid">
              <Grid3X3 className="h-4 w-4" />
              Grid
            </ToggleGroupItem>
            <ToggleGroupItem value="list">
              {" "}
              <List className="h-4 w-4" />
              List
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <AllTags
        allTags={allTags}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        toggleTag={toggleTag}
      />

      {/* Active Filters Summary */}
      {(searchQuery || selectedTags.size > 0 || selectedColor !== "all") && (
        <div className="mt-6 pt-6 border-t border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>
                Showing {filteredAmount} of {totalAmount} profile combos
              </span>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTags(new Set());
                setSelectedColor("all");
              }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
            >
              Reset all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
