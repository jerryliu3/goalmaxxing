"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildCheckInRows } from "./check-in-actions";
import { CheckInRowList } from "./check-in-action-list";
import { CheckInRecapPanel } from "./check-in-recap-panel";
import type { DigestPayload } from "./digest-api";
import type { DigestFactItem } from "@/lib/digest/contract";
export function CheckInBody({ payload, briefingSettled, hrefPrefix = "", onNavigate, onCompleted }: {
  payload: DigestPayload; briefingSettled: boolean; hrefPrefix?: string;
  onNavigate: (href: string | null) => void; onCompleted: (item: DigestFactItem) => void;
}) {
  const { kind, facts, suggestions } = payload;
  return <Tabs defaultValue="recap" className="flex flex-col gap-3"><TabsList variant="line" className="w-full gap-0 rounded-none border-b border-border/70 p-0">{["recap","next"].map(tab => <TabsTrigger key={tab} value={tab} className="relative h-auto flex-1 rounded-none border-0 py-2 text-sm font-medium after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-selection-line data-[state=active]:after:opacity-100">{tab === "recap" ? "Recap" : "Next"}</TabsTrigger>)}</TabsList>
    <TabsContent value="recap"><CheckInRecapPanel recap={facts.recap} localDate={payload.localDate} onCompleted={onCompleted} /></TabsContent>
    <TabsContent value="next" className="space-y-3"><p className="text-sm">{suggestions?.motivation ?? (briefingSettled ? "Start with what’s already on the calendar." : "Reading your plan…")}</p><CheckInRowList rows={buildCheckInRows({kind,facts,suggestions})} hrefPrefix={hrefPrefix} onNavigate={onNavigate} emptyMessage="Nothing needs a decision right now." /></TabsContent>
  </Tabs>;
}
