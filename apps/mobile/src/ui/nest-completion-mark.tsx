import Svg, { Rect } from "react-native-svg";

export function NestCompletionMark({
  done,
  color,
  size = 22,
  label,
}: {
  done: boolean;
  color: string;
  size?: number;
  label?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessible={Boolean(label)}
      accessibilityLabel={label}
      accessibilityRole={label ? "image" : undefined}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? "yes" : "no"}
    >
      <Rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="4"
        fill="none"
        stroke={color}
        strokeWidth="1.7"
      />
      {done ? (
        <Rect
          x="6.6"
          y="6.6"
          width="10.8"
          height="10.8"
          rx="2.4"
          fill={color}
        />
      ) : null}
    </Svg>
  );
}
