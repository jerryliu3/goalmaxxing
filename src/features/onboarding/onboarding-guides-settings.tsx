"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestJourneyIntroOpen } from "@/components/intro/journey-intro-overlay";
import { TAB_ONBOARDING_REPLAY_LINKS } from "@/features/onboarding/tab-onboarding";

function GuideRow({
  label,
  action,
}: {
  label: string;
  action: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3 first:border-t-0">
      <span className="text-sm font-medium">{label}</span>
      {action}
    </div>
  );
}

export function OnboardingGuidesSettings() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Replay the app-wide intro.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <GuideRow
            label="App intro"
            action={
              <Button type="button" variant="outline" size="sm" onClick={requestJourneyIntroOpen}>
                Replay
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Page</CardTitle>
          <CardDescription>Replay first-visit guides for specific tabs.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {TAB_ONBOARDING_REPLAY_LINKS.map((link) => (
            <GuideRow
              key={link.key}
              label={link.label}
              action={
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={link.href}>Replay</Link>
                </Button>
              }
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
