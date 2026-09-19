import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { applicationFontClasses } from "@/lib/brand/fonts.next";
import { getApplicationThemeCss } from "@/lib/brand/application-theme";
import { ApplicationThemeFonts } from "@/components/brand/application-theme-fonts";
import Script from "next/script";
import { Toaster } from "sonner";
import { UiStyleProvider } from "@/components/brand/ui-style-provider";
import { APP_BOOT_PRELOAD_SCRIPT } from "@/components/layout/app-boot-preload";
import { appIconHref } from "@/lib/brand/app-icon";
import { getUiStyle, parseUiStyleId, UI_STYLE_COOKIE_NAME, usesTranslucentStatusBar } from "@/lib/brand/ui-style";
import "./globals.css";

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
      statusBarStyle: usesTranslucentStatusBar(style.id) ? "black-translucent" : "default",
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

  return (
    <html
      lang="en"
      data-ui-style={style.id}
      className={`${applicationFontClasses} ${style.htmlClass} h-full antialiased`.trim()}
      suppressHydrationWarning
    >
      <head><style id="gm-brand-tokens" dangerouslySetInnerHTML={{ __html: getApplicationThemeCss() }} /></head>
      <body
        className="min-h-full bg-background text-foreground flex flex-col"
        suppressHydrationWarning
      >
        <Script
          id="gm-app-boot-preload"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: APP_BOOT_PRELOAD_SCRIPT }}
        />
        <UiStyleProvider initialStyleId={style.id}><ApplicationThemeFonts />{children}</UiStyleProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
