"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const primaryCtaClassName =
  "border-primary bg-primary text-primary-foreground hover:border-primary/80 hover:bg-primary/80";

export function PublicProfileChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="type-wordmark text-xl tracking-tight">
            Goalmaxxing
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className={primaryCtaClassName}>
              <Link href="/signup">Create account</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
