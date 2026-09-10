import { format } from "date-fns";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "../../theme";
import { LoadingScreen, Screen } from "../../ui/screen";
import { useSession } from "../../lib/session";
import { useDuo, useDuoSurfaceScope } from "../duo/DuoProvider";
import { DuoScopeSegmentedControl } from "../duo/DuoScopeSegmentedControl";
import { useReportMobileDuoScopeViewed } from "../duo/telemetry";
import {
  partnerLaneSubject,
  resolveMobileDuoLaneSubjects,
  viewerLaneSubject,
} from "../duo/lane-subjects";
import { useViewerAvatarUrl } from "../duo/use-viewer-avatar-url";
import {
  resolveLanePageSnapInterval,
  resolveLanePageWidth,
  shouldUseLanePager,
} from "../duo/lane-pager";
import { buildInsightsLaneRenderModel } from "./insights-lane-render-model";
import { InsightsLaneSection } from "./InsightsLaneSection";
import { InsightsLedgerPanel } from "./InsightsLedgerPanel";
import { useInsightsLaneData } from "./use-insights-lane-data";
import { usePublicProfileSheet } from "../social/PublicProfileSheetProvider";

export function InsightsScreen() {
  const theme = useTheme();
  const { userId } = useSession();
  const { width: viewportWidth } = useWindowDimensions();
  const { ready, scope, hasActivePartner } =
    useDuoSurfaceScope("insights");
  const { state } = useDuo();
  const activePartner = hasActivePartner ? state.activePartner : null;
  const partnerId = activePartner?.partnerId ?? null;
  useReportMobileDuoScopeViewed({
    enabled: ready,
    surface: "insights",
    scope,
    hasPartner: Boolean(activePartner),
  });
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const viewerAvatarQuery = useViewerAvatarUrl();
  const viewerAvatarUrl = viewerAvatarQuery.data ?? null;
  const { openPublicProfile } = usePublicProfileSheet();
  const partnerSubject = partnerLaneSubject(activePartner);
  const viewerSubject = viewerLaneSubject({
    avatarUrl: viewerAvatarUrl,
    userId,
  });
  const viewerLane = useInsightsLaneData({
    subject: viewerSubject,
    month,
    partnerId,
    enabled: true,
  });
  const partnerLane = useInsightsLaneData({
    subject: partnerSubject ?? viewerSubject,
    month,
    partnerId,
    enabled: Boolean(activePartner) && scope !== "me",
  });
  const lanes = resolveMobileDuoLaneSubjects({
    scope,
    activePartner,
    viewerAvatarUrl,
    viewerUserId: userId,
  });
  const useLanePager = shouldUseLanePager(lanes.length);
  const lanePageWidth = resolveLanePageWidth(viewportWidth);
  const lanePageSnapInterval = resolveLanePageSnapInterval(lanePageWidth);

  if (!ready) {
    return <LoadingScreen label="Loading Progress…" />;
  }

  return (
    <Screen title="Progress" kicker="Ledger">
      <DuoScopeSegmentedControl surface="insights" />
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            const next = new Date(`${month}-01T00:00:00`);
            next.setMonth(next.getMonth() - 1);
            setMonth(format(next, "yyyy-MM"));
          }}
        >
          <Text style={{ color: theme.colors.primary }}>Prev</Text>
        </Pressable>
        <Text style={{ color: theme.colors.foreground, fontWeight: "700" }}>{month}</Text>
        <Pressable
          onPress={() => {
            const next = new Date(`${month}-01T00:00:00`);
            next.setMonth(next.getMonth() + 1);
            setMonth(format(next, "yyyy-MM"));
          }}
        >
          <Text style={{ color: theme.colors.primary }}>Next</Text>
        </Pressable>
      </View>
      {useLanePager ? (
        <ScrollView
          horizontal
          snapToInterval={lanePageSnapInterval}
          snapToAlignment="start"
          disableIntervalMomentum
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lanePagerContent}
        >
          {lanes.map((lane) => {
            const laneData = lane.id === "viewer" ? viewerLane : partnerLane;
            const renderModel = buildInsightsLaneRenderModel({
              scope,
              lane,
              loading: laneData.loading,
              error: laneData.error,
            });
            if (renderModel.status === "loading") {
              return (
                <View key={lane.id} style={[styles.lanePage, { width: lanePageWidth }]}>
                  <InsightsLaneSection
                    showHeading={Boolean(renderModel.heading)}
                    headingLabel={renderModel.heading?.label ?? lane.label}
                    headingAvatarUrl={lane.avatarUrl}
                    headingSubjectUserId={lane.userId ?? null}
                    readOnly={Boolean(renderModel.heading?.readOnly)}
                    tone="muted"
                    message={`Loading ${lane.label.toLowerCase()} insights...`}
                    onOpenProfile={openPublicProfile}
                  />
                </View>
              );
            }

            if (renderModel.status === "partner_unavailable") {
              return (
                <View key={lane.id} style={[styles.lanePage, { width: lanePageWidth }]}>
                  <InsightsLaneSection
                    showHeading={Boolean(renderModel.heading)}
                    headingLabel={renderModel.heading?.label ?? lane.label}
                    headingAvatarUrl={lane.avatarUrl}
                    headingSubjectUserId={lane.userId ?? null}
                    readOnly={Boolean(renderModel.heading?.readOnly)}
                    tone="muted"
                    message="Partner insights are unavailable."
                    onOpenProfile={openPublicProfile}
                  />
                </View>
              );
            }

            if (renderModel.status === "error") {
              return (
                <View key={lane.id} style={[styles.lanePage, { width: lanePageWidth }]}>
                  <InsightsLaneSection
                    showHeading={Boolean(renderModel.heading)}
                    headingLabel={renderModel.heading?.label ?? lane.label}
                    headingAvatarUrl={lane.avatarUrl}
                    headingSubjectUserId={lane.userId ?? null}
                    readOnly={Boolean(renderModel.heading?.readOnly)}
                    tone="destructive"
                    message={
                      laneData.error instanceof Error
                        ? laneData.error.message
                        : "Could not load insights."
                    }
                    onOpenProfile={openPublicProfile}
                  />
                </View>
              );
            }

            return (
              <View key={lane.id} style={[styles.lanePage, { width: lanePageWidth }]}>
                <InsightsLaneSection
                  showHeading={Boolean(renderModel.heading)}
                  headingLabel={renderModel.heading?.label ?? lane.label}
                  headingAvatarUrl={lane.avatarUrl}
                  headingSubjectUserId={lane.userId ?? null}
                  readOnly={Boolean(renderModel.heading?.readOnly)}
                  onOpenProfile={openPublicProfile}
                >
                  <InsightsLedgerPanel
                    goals={laneData.goals}
                    facts={laneData.facts}
                    summaries={laneData.summaries}
                    days={laneData.days}
                    offset={laneData.offset}
                    readOnly={Boolean(renderModel.heading?.readOnly) || lane.readOnly}
                    onToggleCompletion={laneData.toggleCompletion ?? undefined}
                  />
                </InsightsLaneSection>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        lanes.map((lane) => {
        const laneData = lane.id === "viewer" ? viewerLane : partnerLane;
        const renderModel = buildInsightsLaneRenderModel({
          scope,
          lane,
          loading: laneData.loading,
          error: laneData.error,
        });
        if (renderModel.status === "loading") {
          return (
            <InsightsLaneSection
              key={lane.id}
              showHeading={Boolean(renderModel.heading)}
              headingLabel={renderModel.heading?.label ?? lane.label}
              headingAvatarUrl={lane.avatarUrl}
              headingSubjectUserId={lane.userId ?? null}
              readOnly={Boolean(renderModel.heading?.readOnly)}
              tone="muted"
              message={`Loading ${lane.label.toLowerCase()} insights...`}
              onOpenProfile={openPublicProfile}
            />
          );
        }

        if (renderModel.status === "partner_unavailable") {
          return (
            <InsightsLaneSection
              key={lane.id}
              showHeading={Boolean(renderModel.heading)}
              headingLabel={renderModel.heading?.label ?? lane.label}
              headingAvatarUrl={lane.avatarUrl}
              headingSubjectUserId={lane.userId ?? null}
              readOnly={Boolean(renderModel.heading?.readOnly)}
              tone="muted"
              message="Partner insights are unavailable."
              onOpenProfile={openPublicProfile}
            />
          );
        }

        if (renderModel.status === "error") {
          return (
            <InsightsLaneSection
              key={lane.id}
              showHeading={Boolean(renderModel.heading)}
              headingLabel={renderModel.heading?.label ?? lane.label}
              headingAvatarUrl={lane.avatarUrl}
              headingSubjectUserId={lane.userId ?? null}
              readOnly={Boolean(renderModel.heading?.readOnly)}
              tone="destructive"
              message={
                laneData.error instanceof Error
                  ? laneData.error.message
                  : "Could not load insights."
              }
              onOpenProfile={openPublicProfile}
            />
          );
        }

        return (
            <InsightsLaneSection
              key={lane.id}
              showHeading={Boolean(renderModel.heading)}
              headingLabel={renderModel.heading?.label ?? lane.label}
              headingAvatarUrl={lane.avatarUrl}
              headingSubjectUserId={lane.userId ?? null}
              readOnly={Boolean(renderModel.heading?.readOnly)}
              onOpenProfile={openPublicProfile}
            >
              <InsightsLedgerPanel
                goals={laneData.goals}
                facts={laneData.facts}
                summaries={laneData.summaries}
                days={laneData.days}
                offset={laneData.offset}
                readOnly={Boolean(renderModel.heading?.readOnly) || lane.readOnly}
                onToggleCompletion={laneData.toggleCompletion ?? undefined}
              />
            </InsightsLaneSection>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  lanePagerContent: {
    paddingRight: 12,
    gap: 12,
  },
  lanePage: {
    flexShrink: 0,
  },
});
