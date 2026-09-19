import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mia & Scott — RSVP",
  description: "RSVP for Mia & Scott's wedding, November 5-7, 2027 in Palm Springs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {children}
      </body>
    </html>
  );
}
