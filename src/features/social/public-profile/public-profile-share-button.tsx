"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildPublicProfileUrl } from "@/lib/social/public-profile-username";

export function PublicProfileShareButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        const url = buildPublicProfileUrl(username);
        void navigator.clipboard.writeText(url).then(
          () => {
            setCopied(true);
            toast.success("Profile link copied");
            window.setTimeout(() => setCopied(false), 2000);
          },
          () => {
            toast.error("Could not copy profile link");
          }
        );
      }}
    >
      <Link2 className="size-4" />
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
