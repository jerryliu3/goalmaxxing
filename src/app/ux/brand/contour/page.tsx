import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ContourConcept } from "@/features/ux-brand/contour-concept";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-brand-mono",
});

export default function ContourBrandPage() {
  return (
    <div className={`${sans.variable} ${mono.variable} font-[family-name:var(--font-brand-sans)]`}>
      <ContourConcept />
    </div>
  );
}
