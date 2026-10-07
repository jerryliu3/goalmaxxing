"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MedalMark } from "@/features/ux-achievements/medals";
import { ShowcaseMedalShelf, ShowcasePedestal, ShowcasePersonalRecords } from "@/features/achievements/showcase-presentation";
import { SHOWCASE } from "./seed";

export function OverviewAchievements({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = SHOWCASE.levelAwards.find(award => award.id === selectedId);
  const earned = SHOWCASE.levelAwards.filter(award => award.unlockedAt);
  return (
    <section aria-labelledby="overview-achievements-title" className="border-t border-border py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="overview-achievements-title" className="font-display text-2xl">Achievements</h2><p className="mt-1 text-sm text-muted-foreground">Medals, personal records and goals achieved · lifetime</p></div>
        <Button variant="ghost" aria-expanded={expanded} aria-controls="overview-achievement-details" onClick={onToggle}>{expanded ? "Show less" : "Expand collection"}</Button>
      </div>
      <div className="ach-showcase-root ach-showcase-root--study mt-5 rounded-xl p-4">
        {expanded ? (
          <div id="overview-achievement-details" className="space-y-6">
            <ShowcasePersonalRecords records={SHOWCASE.personalRecords} />
            <ShowcaseMedalShelf awards={SHOWCASE.levelAwards} featuredId={selectedId ?? SHOWCASE.collection.featuredAwardId ?? ""} onSelect={setSelectedId} />
            <div className="border-t border-border pt-4 text-sm"><h3 className="font-display text-xl">Achieved goals</h3><p className="mt-2">Learn to swim <span className="text-muted-foreground">· June 28, 2026</span></p><p className="mt-1 text-muted-foreground">Its story is in the 2026 goal library below.</p></div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex gap-3">{earned.map(award => (
              <button key={award.id} type="button" aria-label={`Inspect level ${award.level} medal`} onClick={() => setSelectedId(award.id)} className="rounded-full p-1 focus-visible:outline-2 focus-visible:outline-ring">
                <MedalMark level={award.level} tier={award.tier} size={54} markId={`overview-${award.id}`} />
              </button>
            ))}</div>
            <p className="text-sm text-muted-foreground">Level 8 earned<br /><span className="text-xs">Three medals, one achieved goal.</span></p>
          </div>
        )}
      </div>
      <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelectedId(null); }}>
        <DialogContent className="ach-showcase-root">
          <DialogTitle>{selected?.unlockedAt ? selected.title : "Still ahead"}</DialogTitle>
          <DialogDescription>Inspect this level award.</DialogDescription>
          {selected && <ShowcasePedestal award={selected} headingLevel="h3" />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
