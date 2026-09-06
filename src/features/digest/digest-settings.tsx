"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestDigestOpen, type DigestPayload } from "@/features/digest/digest-api";
import { getApiErrorMessage, getJson, isApiClientError, postJson } from "@/lib/api/client";

export function DigestSettings() {
  const [digestAutoShow, setDigestAutoShow] = useState(true);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const digest = await getJson<DigestPayload>("/api/digest");
      setDigestAutoShow(digest.digestAutoShow);
      setAvailable(true);
    } catch (error) {
      if (isApiClientError(error) && error.code === "digest_disabled") {
        setAvailable(false);
      } else {
        toast.error(getApiErrorMessage(error, "Digest settings could not be loaded."));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveAutoShow = async (next: boolean) => {
    setDigestAutoShow(next);
    setSaving(true);
    try {
      await postJson("/api/digest/settings", { digestAutoShow: next });
    } catch (error) {
      setDigestAutoShow(!next);
      toast.error(getApiErrorMessage(error, "Digest settings could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>First open</CardTitle>
          <CardDescription>
            Show a daily briefing, or a weekly one on the first day of your week. Skip anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!available ? (
            <p className="text-sm text-muted-foreground">
              Digest is not enabled on this environment.
            </p>
          ) : null}
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={digestAutoShow}
              disabled={!available || loading || saving}
              onChange={(event) => void saveAutoShow(event.target.checked)}
            />
            <span>
              Show digest when I first open the app
              <span className="block text-xs text-muted-foreground">
                Replay below still works if this is off.
              </span>
            </span>
          </label>
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
                void postJson("/api/digest/generate", { regenerate: true })
                  .then(() => {
                    requestDigestOpen();
                  })
                  .catch((error) => {
                    toast.error(
                      getApiErrorMessage(error, "Suggestions could not be regenerated.")
                    );
                  })
                  .finally(() => setRegenerating(false));
              }}
            >
              {regenerating ? "Regenerating..." : "Regenerate suggestions"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
