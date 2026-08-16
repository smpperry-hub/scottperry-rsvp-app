import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scott & Mia — RSVP",
  description: "RSVP for Scott & Mia's wedding, November 6, 2027 in Palm Springs.",
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
