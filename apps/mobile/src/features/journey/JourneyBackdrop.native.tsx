import { useMemo, useState } from "react";
import { GAZETTEER } from "@cadence/shared/brand/gazetteer";
import { Platform, StyleSheet, View } from "react-native";
import { ExpoJourneyVideo } from "./ExpoJourneyVideo";
import { RiveJourneyOverlay } from "./RiveJourneyOverlay.native";
import { StaticJourneyPoster } from "./StaticJourneyPoster.native";
import { useJourney } from "./journey-context.native";

export function JourneyBackdrop() {
  const {
    progressState,
    renderPolicy,
    scene,
    latestEffectEvent,
    manifestSource,
    presentation,
  } = useJourney();
  const [videoReady, setVideoReady] = useState(false);

  const posterSource =
    Platform.OS === "web" ? scene.poster.desktop : scene.poster.mobile;
  const primaryVideoSource = useMemo(() => {
    const videoList = Platform.OS === "web" ? scene.video.desktop : scene.video.mobile;
    return videoList[0] ?? null;
  }, [scene.video.desktop, scene.video.mobile]);

  if (!presentation.visible) {
    return null;
  }

  const showVideo = renderPolicy.videoEnabled;
  const showPoster = !showVideo || !videoReady;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      testID="journey-backdrop"
    >
      <StaticJourneyPoster sourceUri={posterSource.url} visible={showPoster} />
      <ExpoJourneyVideo
        source={primaryVideoSource}
        enabled={showVideo}
        paused={renderPolicy.lifecyclePaused}
        onReady={() => setVideoReady(true)}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `${GAZETTEER.page}e0`,
          },
        ]}
      />
      <RiveJourneyOverlay
        progress={progressState}
        policy={renderPolicy}
        latestEffectEvent={latestEffectEvent}
      />
      <View testID={`journey-manifest-source-${manifestSource}`} />
    </View>
  );
}
