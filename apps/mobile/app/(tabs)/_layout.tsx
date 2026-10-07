import { buildAppTabs } from "@cadence/shared/navigation/tabs";
import { Redirect, Tabs } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { useForceUpgradeRequired } from "../../src/lib/runtime-config";
import { useSession } from "../../src/lib/session";
import { DuoProvider } from "../../src/features/duo/DuoProvider";
import { JourneyBackdrop } from "../../src/features/journey/JourneyBackdrop.native";
import { JourneyProvider } from "../../src/features/journey/JourneyProvider.native";
import { PublicProfileSheetProvider } from "../../src/features/social/PublicProfileSheetProvider";
import { useTheme } from "../../src/theme";
import { LoadingScreen } from "../../src/ui/screen";

const TAB_ICONS: Record<string, string> = {
  growth: "▤",
  calendar: "▣",
  social: "◎",
};

function withHexAlpha(color: string, alpha: number) {
  if (!color.startsWith("#") || color.length !== 7) {
    return color;
  }
  const channel = Math.max(0, Math.min(255, Math.round(alpha * 255)));
  return `${color}${channel.toString(16).padStart(2, "0")}`;
}

export default function TabsLayout() {
  const { ready, session } = useSession();
  const upgrade = useForceUpgradeRequired();
  const theme = useTheme();
  const tabs = buildAppTabs();

  if (!ready || upgrade.loading) {
    return <LoadingScreen />;
  }
  if (upgrade.required) {
    return <Redirect href="/upgrade" />;
  }
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <JourneyProvider>
      <JourneyBackdrop />
      <DuoProvider>
        <PublicProfileSheetProvider>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: withHexAlpha(theme.colors.background, 0.92),
                borderTopColor: theme.colors.border,
                borderTopWidth: StyleSheet.hairlineWidth,
                elevation: 0,
                shadowOpacity: 0,
              },
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: theme.colors.mutedForeground,
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: "600",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              },
            }}
          >
            {tabs.map((tab) => (
              <Tabs.Screen
                key={tab.key}
                name={tab.key}
                options={{
                  title: tab.label,
                  tabBarLabel: tab.label,
                  href:
                    tab.key === "social" && upgrade.flags && !upgrade.flags.socialEnabled
                      ? null
                      : undefined,
                  tabBarIcon: ({ color }) => (
                    <Text style={{ color, fontSize: 14 }}>{TAB_ICONS[tab.key]}</Text>
                  ),
                }}
              />
            ))}
            <Tabs.Screen name="settings" options={{ href: null }} />
            <Tabs.Screen name="checklist" options={{ href: null }} />
            <Tabs.Screen name="tasks" options={{ href: null }} />
          </Tabs>
        </PublicProfileSheetProvider>
      </DuoProvider>
    </JourneyProvider>
  );
}
