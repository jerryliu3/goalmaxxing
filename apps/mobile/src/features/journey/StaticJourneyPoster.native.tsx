import { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";

interface StaticJourneyPosterProps {
  sourceUri: string;
  visible: boolean;
}

export function StaticJourneyPoster({
  sourceUri,
  visible,
}: StaticJourneyPosterProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [sourceUri]);

  if (loadFailed) {
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
        setLoadFailed(true);
      }}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    zIndex: -10,
  },
});
