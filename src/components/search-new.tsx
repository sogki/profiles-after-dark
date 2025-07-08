import { useId } from "react";
import { ArrowRightIcon, SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SearchNewProps = {
  inputClassName?: string;
  searchIconSize?: number;
  submitIconSize?: number;
  leftIcon?: {
    icon?: React.ReactNode;
    className?: string;
    showLeftIcon?: boolean;
    onLeftIconClick?: () => void;
  };
  value?: string;
  searchIconClassName?: string;
  searchPlaceholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function SearchNew({
  inputClassName,
  searchIconSize = 16,
  submitIconSize = 16,
  searchIconClassName,
  searchPlaceholder = "Search...",
  leftIcon,
  value,
  onChange,
}: SearchNewProps) {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <div className="relative">
        <Input
          id={id}
          className={cn("peer ps-9 pe-9", inputClassName)}
          placeholder={searchPlaceholder}
          type="search"
          value={value}
          onChange={onChange}
        />
        <div
          className={cn(
            "text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50",
            searchIconClassName
          )}
        >
          <SearchIcon size={searchIconSize} />
        </div>
        {leftIcon?.showLeftIcon && (
          <button
            className={cn(
              "text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon?.className
            )}
            onClick={leftIcon?.onLeftIconClick}
          >
            {leftIcon?.icon ?? (
              <ArrowRightIcon size={submitIconSize} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
