import { gazetteerCategoryColor } from "@cadence/shared/brand/gazetteer";
import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme";
import { NestCompletionMark } from "../../ui/nest-completion-mark";

export function ChecklistGoalRow({
  title,
  category,
  done,
  interactive,
  readOnlyReason,
  href,
  onToggle,
  toggling = false,
}: {
  title: string;
  category: string;
  done: boolean;
  interactive: boolean;
  readOnlyReason?: string;
  href?: Href;
  onToggle: () => void;
  toggling?: boolean;
}) {
  const theme = useTheme();
  const categoryColor = gazetteerCategoryColor(category);
  const nest = (
    <NestCompletionMark
      done={done}
      color={done ? categoryColor : theme.colors.mutedForeground}
      size={22}
    />
  );

  return (
    <View
      style={[
        styles.row,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          borderLeftColor: categoryColor,
        },
      ]}
    >
      {interactive ? (
        <Pressable
          disabled={toggling}
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityLabel={title}
          accessibilityState={{ checked: done, disabled: toggling }}
          style={styles.toggle}
        >
          {nest}
        </Pressable>
      ) : (
        <View
          accessible
          accessibilityRole="checkbox"
          accessibilityLabel={title}
          accessibilityState={{ checked: done, disabled: true }}
          style={styles.readOnlyStatus}
        >
          {nest}
        </View>
      )}
      {interactive && href ? (
        <Link href={href} style={styles.titleWrap}>
          <Text
            style={{
              color: theme.colors.foreground,
              fontWeight: "600",
              fontFamily: theme.fonts?.display,
            }}
          >
            {title}
          </Text>
          <Text style={{ color: categoryColor, fontSize: 12, letterSpacing: 0.6 }}>
            {category}
          </Text>
        </Link>
      ) : (
        <View style={styles.titleWrap}>
          <Text
            style={{
              color: theme.colors.foreground,
              fontWeight: "600",
              fontFamily: theme.fonts?.display,
            }}
          >
            {title}
          </Text>
          <Text style={{ color: categoryColor, fontSize: 12, letterSpacing: 0.6 }}>
            {category}
          </Text>
          {readOnlyReason ? (
            <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>
              {readOnlyReason}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: 12,
  },
  toggle: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  readOnlyStatus: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: { flex: 1, gap: 2 },
});
