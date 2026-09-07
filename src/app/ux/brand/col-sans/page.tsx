import { Figtree, IBM_Plex_Mono } from "next/font/google";
import { ColSansConcept } from "@/features/ux-brand/finalists";

const display = Figtree({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-brand-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-brand-mono",
});

export default function ColSansBrandPage() {
  return (
    <div
      className={`${display.variable} ${mono.variable} font-[family-name:var(--font-brand-display)]`}
    >
      <ColSansConcept />
    </div>
  );
}
