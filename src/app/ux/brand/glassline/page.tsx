import { Inter } from "next/font/google";
import { GlasslineConcept } from "@/features/ux-brand/atmosphere-modern";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-brand-sans",
});

export default function GlasslineBrandPage() {
  return (
    <div className={sans.variable}>
      <GlasslineConcept />
    </div>
  );
}
