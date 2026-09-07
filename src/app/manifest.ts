import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Goalmaxxing",
    short_name: "Goalmaxxing",
    description: "Personal goal tracking with insights and social accountability.",
    start_url: "/calendar",
    scope: "/",
    display: "standalone",
    background_color: "#f3ead8",
    theme_color: "#9A4F2C",
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
