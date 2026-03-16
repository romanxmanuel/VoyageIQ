import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"]
});

const display = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "VoyageIQ",
  description: "Constraint-aware travel optimizer for trip strategy under real constraints."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}

