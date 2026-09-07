import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { IonConcept } from "@/features/ux-brand/atmosphere-modern";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-brand-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-brand-mono",
});

export default function IonBrandPage() {
  return (
    <div className={`${display.variable} ${mono.variable}`}>
      <IonConcept />
    </div>
  );
}
