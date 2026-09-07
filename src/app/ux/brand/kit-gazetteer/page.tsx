import { IBM_Plex_Mono, Newsreader, Source_Sans_3 } from "next/font/google";
import { GazetteerKit } from "@/features/ux-brand/applied-kit";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-brand-display",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-brand-mono",
});

export default function GazetteerKitPage() {
  return (
    <div
      className={`${display.variable} ${sans.variable} ${mono.variable} font-[family-name:var(--font-brand-sans)]`}
    >
      <GazetteerKit />
    </div>
  );
}
