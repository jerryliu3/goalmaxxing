import { useState } from "react";
import { Image, StyleSheet } from "react-native";

interface StaticJourneyPosterProps {
  sourceUri: string;
  visible: boolean;
}

export function StaticJourneyPoster({
  sourceUri,
  visible,
}: StaticJourneyPosterProps) {
  const [failedSourceUri, setFailedSourceUri] = useState<string | null>(null);

  if (failedSourceUri === sourceUri) {
    return null;
  }

  return (
    <Image
      alt=""
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      source={{ uri: sourceUri }}
      style={[StyleSheet.absoluteFill, styles.image, { opacity: visible ? 1 : 0 }]}
      resizeMode="cover"
      onError={() => {
        setFailedSourceUri(sourceUri);
      }}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    zIndex: -10,
  },
});
