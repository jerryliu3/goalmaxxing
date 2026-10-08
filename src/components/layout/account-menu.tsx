"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Settings, UserRound } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import type { DuoScope } from "@cadence/shared/social/duo";
import { useDuo, useDuoScope } from "@/features/social/duo/duo-context";
import { resolveDuoSurfaceDefault } from "@/lib/social/duo/surface-defaults";
import { cn } from "@/lib/utils";

type Person = { name: string; avatarUrl: string | null };

const SCOPE_OPTIONS: ReadonlyArray<{ value: DuoScope; label: string }> = [
  { value: "me", label: "Solo" },
  { value: "partner", label: "Partner" },
  { value: "both", label: "Duo" },
];

// The header face is the trigger itself, so it can be as large as the
// wordmark meter beside it; menu rows use the small one.
const FACE_SIZE = {
  lg: { box: "size-10 text-sm", icon: "size-5", overlap: "-ml-3.5" },
  sm: { box: "size-7 text-[11px]", icon: "size-4", overlap: "-ml-2.5" },
} as const;
type FaceSize = keyof typeof FACE_SIZE;

function Face({ person, showPhoto, size }: { person: Person; showPhoto: boolean; size: FaceSize }) {
  const words = person.name.trim().split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : person.name.trim().slice(0, 2)).toUpperCase();
  return (
    <span className={cn(FACE_SIZE[size].box, "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground ring-2 ring-background")}>
      {showPhoto && person.avatarUrl ? (
        // Remote avatar URLs from Supabase storage; next/image would need per-host config.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.avatarUrl} alt="" className="size-full object-cover" />
      ) : showPhoto && initials ? (
        initials
      ) : (
        <UserRound aria-hidden="true" className={FACE_SIZE[size].icon} />
      )}
    </span>
  );
}

/** Overlapping faces: one for Solo or Partner, both for Duo. */
function Faces({ people, showPhoto, size = "lg" }: { people: Person[]; showPhoto: boolean; size?: FaceSize }) {
  return (
    <span className="flex items-center" aria-hidden="true">
      {people.map((person, index) => (
        // Earlier faces sit in front, so the viewer leads the Duo stack.
        <span key={`${person.name}-${index}`} className={cn("relative", index > 0 && FACE_SIZE[size].overlap)} style={{ zIndex: people.length - index }}>
          <Face person={person} showPhoto={showPhoto} size={size} />
        </span>
      ))}
    </span>
  );
}

/**
 * The avatar is the account menu, as in most consumer apps: it always opens the
 * menu, which holds the Solo / Partner / Duo view (when paired) and profile.
 * The trigger is just the faces, with no pill or chevron around them, so the
 * photo gets the header's full height and shows whose plan is on screen.
 */
export function AccountMenu({ settingsHref, showPhotos }: { settingsHref: string; showPhotos: boolean }) {
  const pathname = usePathname();
  const { viewerLabel, viewerAvatarUrl } = useDuo();
  const { scope, activePartner, setScopePreference } = useDuoScope(
    resolveDuoSurfaceDefault(pathname)
  );
  const viewer: Person = { name: viewerLabel, avatarUrl: viewerAvatarUrl };
  const partner: Person | null = activePartner
    ? {
        name: activePartner.partnerDisplayName ?? activePartner.partnerUsername ?? "Partner",
        avatarUrl: activePartner.partnerAvatarUrl,
      }
    : null;
  const facesFor = (value: DuoScope): Person[] =>
    !partner || value === "me" ? [viewer] : value === "partner" ? [partner] : [viewer, partner];
  const selectedLabel = SCOPE_OPTIONS.find((option) => option.value === scope)?.label ?? "Solo";
  // Profile has no tab, so the face carries the "you are here" state instead.
  const onProfile = pathname === settingsHref || pathname.startsWith(`${settingsHref}/`);
  const itemClass =
    "flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm outline-none select-none data-[highlighted]:bg-muted";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        data-onboarding="nav.settings"
        aria-label={partner ? `Account menu, ${selectedLabel} view` : "Account menu"}
        aria-current={onProfile ? "page" : undefined}
        data-active={onProfile ? "" : undefined}
        className="flex shrink-0 items-center rounded-full transition-[box-shadow,opacity] outline-none hover:opacity-90 hover:ring-2 hover:ring-border focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:ring-2 data-[state=open]:ring-border data-active:ring-2 data-active:ring-foreground data-active:ring-offset-2 data-active:ring-offset-page"
      >
        <Faces people={facesFor(scope)} showPhoto={showPhotos} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-52 rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_12px_40px_rgb(0_0_0/0.12)]"
        >
          {partner ? (
            <>
              <DropdownMenu.Label className="type-eyebrow px-2.5 pt-1.5 pb-1 text-[10px] text-muted-foreground">
                Viewing
              </DropdownMenu.Label>
              <DropdownMenu.RadioGroup value={scope} onValueChange={(value) => setScopePreference(value as DuoScope)}>
                {SCOPE_OPTIONS.map((option) => (
                  <DropdownMenu.RadioItem key={option.value} value={option.value} textValue={option.label} className={itemClass}>
                    <span className="flex w-12 justify-start">
                      <Faces people={facesFor(option.value)} showPhoto={showPhotos} size="sm" />
                    </span>
                    <span className="min-w-0 flex-1 font-medium">{option.label}</span>
                    <DropdownMenu.ItemIndicator>
                      <Check aria-hidden="true" className="size-4" />
                    </DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
              <DropdownMenu.Separator className="mx-1 my-1.5 h-px bg-border" />
            </>
          ) : null}
          <DropdownMenu.Item asChild className={cn(itemClass, onProfile && "bg-muted/60")}>
            <Link href={settingsHref} aria-current={onProfile ? "page" : undefined}>
              <Settings aria-hidden="true" className="size-4 text-muted-foreground" />
              Profile settings
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
      {partner ? (
        <span className="sr-only" aria-live="polite">{selectedLabel} view selected</span>
      ) : null}
    </DropdownMenu.Root>
  );
}
