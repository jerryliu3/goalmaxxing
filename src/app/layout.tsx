import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, IBM_Plex_Mono, Newsreader, Source_Sans_3 } from "next/font/google";
import { Toaster } from "sonner";
import { UiStyleProvider } from "@/components/brand/ui-style-provider";
import { APP_BOOT_PRELOAD_SCRIPT } from "@/components/layout/app-boot-preload";
import { appIconHref } from "@/lib/brand/app-icon";
import { getUiStyle, parseUiStyleId, UI_STYLE_COOKIE_NAME } from "@/lib/brand/ui-style";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const metadataBase = (() => {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    return undefined;
  }
  try {
    const url = new URL(configured);
    return new URL(url.origin);
  } catch {
    return undefined;
  }
})();

export async function generateMetadata(): Promise<Metadata> {
  const style = getUiStyle(
    parseUiStyleId((await cookies()).get(UI_STYLE_COOKIE_NAME)?.value)
  );
  const iconUrl = appIconHref(style.id);
  return {
    title: "Goalmaxxing",
    description: "Personal goal tracking with insights and social accountability.",
    applicationName: "Goalmaxxing",
    metadataBase,
    appleWebApp: {
      capable: true,
      statusBarStyle: style.id === "gazetteer" ? "black-translucent" : "default",
      title: "Goalmaxxing",
    },
    icons: {
      icon: { url: iconUrl, type: "image/svg+xml" },
      apple: { url: iconUrl, type: "image/svg+xml" },
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const style = getUiStyle(
    parseUiStyleId((await cookies()).get(UI_STYLE_COOKIE_NAME)?.value)
  );
  return {
    themeColor: style.backgroundColor,
    viewportFit: "cover",
    maximumScale: 1,
    minimumScale: 1,
    userScalable: false,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const style = getUiStyle(
    parseUiStyleId((await cookies()).get(UI_STYLE_COOKIE_NAME)?.value)
  );
  const fontVariables = [
    geistSans.variable,
    geistMono.variable,
    newsreader.variable,
    sourceSans.variable,
    plexMono.variable,
  ].join(" ");

  return (
    <html
      lang="en"
      data-ui-style={style.id}
      className={`${fontVariables} ${style.htmlClass} h-full antialiased`.trim()}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-background text-foreground flex flex-col"
        suppressHydrationWarning
      >
        <script dangerouslySetInnerHTML={{ __html: APP_BOOT_PRELOAD_SCRIPT }} />
        <UiStyleProvider initialStyleId={style.id}>{children}</UiStyleProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
