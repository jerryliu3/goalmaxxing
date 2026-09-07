import { Figtree, IBM_Plex_Mono } from "next/font/google";
import { ColKit } from "@/features/ux-brand/applied-kit";

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

export default function ColKitPage() {
  return (
    <div
      className={`${display.variable} ${mono.variable} font-[family-name:var(--font-brand-display)]`}
    >
      <ColKit />
    </div>
  );
}
