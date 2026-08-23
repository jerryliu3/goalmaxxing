import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DemoBanner() {
  return (
    <div
      data-testid="demo-banner"
      className="sticky top-0 z-[60] border-b bg-background/95 px-4 py-2 backdrop-blur"
    >
      <div className="mx-auto flex min-h-12 max-w-5xl flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          You&apos;re exploring a demo. Changes stay in this tab until you refresh.
        </p>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/signup">Create account</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/">Back to website</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
