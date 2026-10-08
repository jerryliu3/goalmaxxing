"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { requestDigestOpen, type DigestPayload } from "@/features/digest/digest-api";
import { getApiErrorMessage, getJson, isApiClientError, postJson } from "@/lib/api/client";

export function DigestSettings() {
  const [digestAutoShow, setDigestAutoShow] = useState(true);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getJson<DigestPayload>("/api/digest")
      .then((digest) => {
        if (cancelled) {
          return;
        }
        setDigestAutoShow(digest.digestAutoShow);
        setAvailable(true);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        if (isApiClientError(error) && error.code === "digest_disabled") {
          setAvailable(false);
        } else {
          toast.error(getApiErrorMessage(error, "Check-in settings could not be loaded."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveAutoShow = async (next: boolean) => {
    setDigestAutoShow(next);
    setSaving(true);
    try {
      await postJson("/api/digest/settings", { digestAutoShow: next });
    } catch (error) {
      setDigestAutoShow(!next);
      toast.error(getApiErrorMessage(error, "Check-in settings could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Daily by default, weekly on the first day of your week, and monthly on the first of the
        month. Skip any time.
      </p>
      {!available ? (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          Check-ins are not enabled on this environment.
        </p>
      ) : null}
      <div className="space-y-1">
        <ToggleSwitch
          checked={digestAutoShow}
          disabled={!available || loading || saving}
          onChange={(next) => void saveAutoShow(next)}
        >
          Show my check-in when I first open the app
        </ToggleSwitch>
        <p className="pl-2.5 text-xs text-muted-foreground">
          Replay still works when this is off.
        </p>
      </div>
      <div className="space-y-2 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Replay opens the check-in owed today. The monthly one is only owed on the first of the
          month.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={requestDigestOpen}
            disabled={!available || loading}
          >
            Replay
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!available || loading || regenerating}
            onClick={() => {
              setRegenerating(true);
              void getJson<DigestPayload>("/api/digest").then(digest=>postJson("/api/digest/generate", { referenceId:digest.id }))
                .then(() => {
                  requestDigestOpen();
                })
                .catch((error) => {
                  toast.error(
                    getApiErrorMessage(error, "The briefing could not be regenerated.")
                  );
                })
                .finally(() => setRegenerating(false));
            }}
          >
            {regenerating ? "Regenerating..." : "Regenerate briefing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
