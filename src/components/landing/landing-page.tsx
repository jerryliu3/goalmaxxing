import Link from "next/link";
import { ArrowDown, ArrowRight, SquareArrowOutUpRight } from "lucide-react";
import { LandingFeatureBento } from "@/components/landing/landing-feature-bento";
import { LandingFeatureNarrative } from "@/components/landing/landing-feature-narrative";
import { LandingPlannerPreview } from "@/components/landing/landing-planner-preview";
import { LandingProductTour } from "@/components/landing/landing-product-tour";
import { LandingWowChapter } from "@/components/landing/landing-wow-chapter";
import { UiStylePicker } from "@/components/brand/ui-style-picker";
import { Button } from "@/components/ui/button";

const primaryCtaClassName =
  "border-primary bg-primary text-primary-foreground hover:border-primary/80 hover:bg-primary/80";

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-page text-foreground">
      <div
        aria-hidden="true"
        className="gm-landing-atmosphere pointer-events-none absolute inset-0 -z-10"
      />
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight">
            Goalmaxxing
          </Link>
          <nav className="flex items-center gap-2">
            <UiStylePicker showLabel={false} size="sm" />
            <Button asChild size="sm" className={primaryCtaClassName}>
              <Link href="/signup">Create account</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-center md:py-10">
          <div className="max-w-xl space-y-6">
            <h1 className="font-display text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem]">
              Achieve your goals using one focused system
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Deeply customizable goals beyond basic habits. Fully adjustable
              sessions for when plans and priorities change.
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
                  <Link href="/demo" target="_blank" rel="noopener noreferrer">
                    Try demo
                    <SquareArrowOutUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
              <Button asChild variant="outline" size="lg">
                <Link href="#why-goalmaxxing">
                  Read why this was built
                  <ArrowDown className="size-4" />
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
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
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
