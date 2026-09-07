import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { GazetteerSansConcept } from "@/features/ux-brand/finalists";

const display = Schibsted_Grotesk({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-brand-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-brand-mono",
});

export default function GazetteerSansBrandPage() {
  return (
    <div
      className={`${display.variable} ${mono.variable} font-[family-name:var(--font-brand-display)]`}
    >
      <GazetteerSansConcept />
    </div>
  );
}
