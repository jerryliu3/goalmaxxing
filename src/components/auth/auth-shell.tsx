import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  description: string;
  alternateHref: string;
  alternateLabel: string;
  alternateText: string;
  backgroundClassName?: string;
  children: ReactNode;
}

export function AuthShell({
  title,
  description,
  alternateHref,
  alternateLabel,
  alternateText,
  backgroundClassName,
  children,
}: AuthShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-page px-4 py-10",
        backgroundClassName
      )}
    >
      <section className="w-full max-w-md space-y-6 border-b border-border pb-8">
        <div className="space-y-2">
          <p className="type-eyebrow text-[11px] text-primary">
            Goalmaxxing
          </p>
          <h1 className="type-hero text-2xl tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-6">
          {children}
          <p className="text-sm text-muted-foreground">
            {alternateText}{" "}
            <Link className="font-medium text-primary hover:underline" href={alternateHref}>
              {alternateLabel}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
