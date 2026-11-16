import type { Metadata, Viewport } from "next";
import { Caveat, IBM_Plex_Mono, Instrument_Sans, Instrument_Serif } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const ui = Instrument_Sans({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif-display", display: "swap" });
const receipt = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-receipt", display: "swap" });
const hand = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-hand", display: "swap" });

export const metadata: Metadata = {
  title: "BillDrama – split trip expenses with friends",
  description: "Tell us who paid what on your trip. We'll tell you who owes whom. Free, no sign-up.",
  applicationName: "BillDrama",
  openGraph: {
    title: "BillDrama – split trip expenses with friends",
    description: "Great trips. Shared memories. Who owes whom?",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#182321" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: next-themes sets the theme class on <html> before React hydrates.
    <html lang="en" className={`${ui.variable} ${serif.variable} ${receipt.variable} ${hand.variable}`} suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
