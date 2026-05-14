import type { Metadata } from "next";
import { Inter, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Municipal — New Haven public records",
  description:
    "Look up any New Haven rental address: landlord, complaint history, license status, and risk score. Built from the city's own data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-paper">
        <header className="border-b border-steel">
          <div className="mx-auto w-full max-w-[var(--container-content)] px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="font-serif font-bold text-paper no-underline tracking-tight text-[22px] hover:no-underline hover:text-paper"
              style={{ letterSpacing: "-0.01em" }}
            >
              Municipal
            </Link>
            <nav className="flex gap-7 text-[13px] text-fog">
              <Link
                href="/"
                className="text-fog no-underline hover:text-paper hover:no-underline"
              >
                Lookup
              </Link>
              <Link
                href="/investigation"
                className="text-fog no-underline hover:text-paper hover:no-underline"
              >
                Investigation
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-steel mt-16">
          <div className="mx-auto w-full max-w-[var(--container-content)] px-6 py-6 text-xs text-ash leading-relaxed">
            Data sourced from the New Haven Livable City Initiative (Veoci) and CitySquared.
            Municipal is an independent public-records project. Not affiliated with the City of New Haven.
          </div>
        </footer>
      </body>
    </html>
  );
}
