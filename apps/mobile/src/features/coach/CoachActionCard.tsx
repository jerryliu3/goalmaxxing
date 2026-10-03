import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { createClientUuid } from "@cadence/shared/ids";
import { coachActionPreviewLines, type CoachAction } from "@cadence/shared/coach";
import { useTheme } from "../../theme";
import { PrimaryButton } from "../../ui/button";
import { useNativeCoach } from "./coach-context";

export function CoachActionCard({ action }: { action: CoachAction }) {
  const coach = useNativeCoach()!;
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const requestId = useRef(createClientUuid());
  const operate = async (operation: "apply" | "reject" | "refresh" | "undo") => {
    setBusy(true);
    try { await coach.operate(action.id, operation, requestId.current, action.thread_id); } finally { setBusy(false); }
  };
  return <View style={{ borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginTop: 12, borderRadius: 12, gap: 8 }}>
    <Text style={{ color: theme.colors.foreground, fontWeight: "600" }}>{action.title}</Text>
    {coachActionPreviewLines(action.preview, action.kind).map((line,index) => <Text key={index} style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>{line}</Text>)}
    {action.status === "proposed" ? <>
      {coach.page.hasDraft && <Text style={{ color: theme.colors.mutedForeground }}>Save or discard your planner draft before applying changes.</Text>}
      <PrimaryButton label="Apply" disabled={busy || coach.busy || coach.page.hasDraft} onPress={() => void operate("apply")} />
      {!action.inverse_of && <PrimaryButton label="Refresh proposal" disabled={busy} onPress={() => void operate("refresh")} />}
      <PrimaryButton label="Dismiss" disabled={busy} onPress={() => void operate("reject")} />
    </> : <Text style={{ color: theme.colors.mutedForeground }}>{action.status}</Text>}
    {action.status === "applied" && action.preview.undoable === true && <PrimaryButton label="Review undo" disabled={busy} onPress={() => void operate("undo")} />}
  </View>;
}
