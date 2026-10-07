import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import { UiStyleProvider } from "@/components/brand/ui-style-provider";
import { APP_BOOT_PRELOAD_SCRIPT } from "@/components/layout/app-boot-preload";
import { appIconHref } from "@/lib/brand/app-icon";
import { FONT_VARIABLE_CLASSES } from "@/lib/brand/fonts";
import { requestTheme } from "@/lib/brand/request-theme";
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
  const style = await requestTheme();
  const iconUrl = appIconHref(style.id);
  return {
    title: "Goalmaxxing",
    description: "Personal goal tracking with insights and social accountability.",
    applicationName: "Goalmaxxing",
    metadataBase,
    appleWebApp: {
      capable: true,
      statusBarStyle: style.statusBarStyle,
      title: "Goalmaxxing",
    },
    icons: {
      icon: { url: iconUrl, type: "image/svg+xml" },
      apple: { url: iconUrl, type: "image/svg+xml" },
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const style = await requestTheme();
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
  const style = await requestTheme();

  return (
    <html
      lang="en"
      data-ui-style={style.id}
      data-appearance={style.appearance}
      className={`${FONT_VARIABLE_CLASSES} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-background text-foreground flex flex-col"
        suppressHydrationWarning
      >
        <Script
          id="gm-app-boot-preload"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: APP_BOOT_PRELOAD_SCRIPT }}
        />
        <UiStyleProvider initialStyleId={style.id}>
          {children}
        </UiStyleProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
