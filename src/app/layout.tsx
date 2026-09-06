import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Newsreader, Source_Sans_3 } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Goalmaxxing",
  description: "Personal goal tracking with insights and social accountability.",
  applicationName: "Goalmaxxing",
  metadataBase,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Goalmaxxing",
  },
  icons: {
    icon: "/cadence-icon.svg",
    apple: "/cadence-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#9A4F2C",
  viewportFit: "cover",
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${sourceSans.variable} ${plexMono.variable} gm-gazetteer h-full antialiased`}
    >
      <body className="gm-gazetteer min-h-full bg-background text-foreground flex flex-col">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
