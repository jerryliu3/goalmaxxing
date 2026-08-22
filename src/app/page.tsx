import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import {
  isValidCalendarViewMode,
  isValidDate,
  isValidMonth,
} from "@/features/today/checklist-shell-routing";

export const metadata: Metadata = {
  title: "Goalmaxxing - Plan goals and build consistency",
  description:
    "Goalmaxxing helps you plan goals, complete daily checklists, and track momentum with insights and accountability.",
};

export const viewport: Viewport = {
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function MarketingLandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const day = firstParam(params.day) ?? null;
  const tab = firstParam(params.tab) ?? null;
  const month = firstParam(params.month) ?? null;
  const view = firstParam(params.view) ?? null;

  if (isValidDate(day)) {
    const nextParams = new URLSearchParams();
    nextParams.set("view", "day");
    nextParams.set("day", day);
    nextParams.set("month", day.slice(0, 7));
    redirect(`/calendar?${nextParams.toString()}`);
  }

  if (tab === "today" || tab === "not-today" || tab === "past") {
    const normalizedTab = tab === "past" ? "not-today" : tab;
    redirect(`/checklist?tab=${normalizedTab}`);
  }

  const nextParams = new URLSearchParams();
  if (isValidCalendarViewMode(view)) {
    nextParams.set("view", view);
  }
  if (isValidMonth(month)) {
    nextParams.set("month", month);
  }
  const query = nextParams.toString();
  if (query.length > 0) {
    redirect(`/calendar?${query}`);
  }

  return <LandingPage />;
}
