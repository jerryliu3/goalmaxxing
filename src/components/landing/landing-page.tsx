import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingFeatureBento } from "@/components/landing/landing-feature-bento";
import { LandingFeatureNarrative } from "@/components/landing/landing-feature-narrative";
import { LandingPlannerPreview } from "@/components/landing/landing-planner-preview";
import { LandingProductTour } from "@/components/landing/landing-product-tour";
import { LandingWowChapter } from "@/components/landing/landing-wow-chapter";
import { Button } from "@/components/ui/button";

const primaryCtaClassName =
  "border-blue-700 bg-blue-700 text-white hover:border-blue-800 hover:bg-blue-800 dark:border-blue-700 dark:bg-blue-700 dark:text-white dark:hover:border-blue-800 dark:hover:bg-blue-800";

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-50 text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_12%_-8%,rgba(191,219,254,0.7),transparent_55%),radial-gradient(900px_circle_at_92%_6%,rgba(219,234,254,0.8),transparent_52%),radial-gradient(800px_circle_at_78%_88%,rgba(224,231,255,0.45),transparent_50%)]"
      />
      <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Goalmaxxing
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild size="sm" className={primaryCtaClassName}>
              <Link href="/signup">Create account</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-center md:py-10">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Short-term execution, long-term outcomes
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Achieve your goals using one focused system.
            </h1>
            <p className="max-w-md text-base text-muted-foreground sm:text-lg">
              Plan beyond daily habits. Connect today&apos;s actions to the weeks and
              months ahead.
            </p>
            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className={primaryCtaClassName}>
                  <Link href="/calendar">
                    Go to app
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#why-goalmaxxing">Read why</Link>
                </Button>
              </div>
              <Button asChild variant="outline" size="lg">
                <Link href="/demo" target="_blank" rel="noopener noreferrer">
                  Try demo
                </Link>
              </Button>
            </div>
          </div>

          <LandingPlannerPreview />
        </section>

        <LandingProductTour />
        <LandingWowChapter />
        <LandingFeatureBento />
        <LandingFeatureNarrative />

        <section className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Build momentum across weeks, not just days.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Start with a clear weekly plan, track the execution signals that matter, and
            keep long-term goals in view.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className={primaryCtaClassName}>
              <Link href="/signup">Create account</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/demo" target="_blank" rel="noopener noreferrer">
                Try demo
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 text-sm text-muted-foreground sm:px-6">
          <span>Goalmaxxing</span>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <a href="mailto:hello@goalmaxxing.xyz">Contact</a>
            </Button>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
