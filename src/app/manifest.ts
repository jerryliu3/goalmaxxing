import type { MetadataRoute } from "next";
import { cookies } from "next/headers";
import { getUiStyle, parseUiStyleId, UI_STYLE_COOKIE_NAME } from "@/lib/brand/ui-style";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const style = getUiStyle(
    parseUiStyleId((await cookies()).get(UI_STYLE_COOKIE_NAME)?.value)
  );
  return {
    id: "/",
    name: "Goalmaxxing",
    short_name: "Goalmaxxing",
    description: "Personal goal tracking with insights and social accountability.",
    start_url: "/calendar",
    scope: "/",
    display: "standalone",
    background_color: style.backgroundColor,
    theme_color: style.themeColor,
    icons: [
      {
        src: "/cadence-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/cadence-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
