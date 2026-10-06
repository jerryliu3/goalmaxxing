import type { MetadataRoute } from "next";
import { appIconHref } from "@/lib/brand/app-icon";
import { requestTheme } from "@/lib/brand/request-theme";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const style = await requestTheme();
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
        src: appIconHref(style.id),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: appIconHref(style.id),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
