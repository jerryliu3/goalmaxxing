"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { publicProfileUrl } from "@/features/ux-profile/model";

/** The public URL line. Owners get Copy; visitors just see where they are. */
export function ProfileLink({
  username,
  copyable = false,
  className = "",
}: {
  username: string;
  copyable?: boolean;
  className?: string;
}) {
  const url = publicProfileUrl(username);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(`https://${url}`).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => undefined
    );
  };

  return (
    <div
      className={`flex min-h-10 items-center gap-2 rounded-full border border-border/70 bg-card py-1 pl-3.5 pr-1 ${className}`}
    >
      <Link2 aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate font-mono text-xs">{url}</span>
      {copyable ? (
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-semibold"
        >
          {copied ? <Check aria-hidden className="size-3.5" /> : null}
          {copied ? "Copied" : "Copy link"}
        </button>
      ) : null}
    </div>
  );
}
