import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Filled pill search input with a leading icon; it lifts to the page color on focus. */
export function SearchField({ className, ...props }: Omit<ComponentProps<typeof Input>, "type">) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        className="h-9 w-full rounded-full border-transparent bg-muted pl-10 text-[13px] hover:bg-muted/70 focus-visible:border-border focus-visible:bg-background md:text-[13px]"
        {...props}
      />
    </div>
  );
}
