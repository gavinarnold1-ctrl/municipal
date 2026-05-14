import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
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
  weight: ["600", "700"],
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
      className={`${inter.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-paper">
        <header className="border-b border-steel">
          <div className="mx-auto w-full max-w-[var(--container-content)] px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="font-serif text-xl font-bold text-paper no-underline hover:no-underline"
            >
              Municipal
            </Link>
            <nav className="flex gap-6 text-sm text-fog">
              <Link href="/" className="text-fog no-underline hover:text-paper hover:no-underline">
                Lookup
              </Link>
              <Link href="/investigation" className="text-fog no-underline hover:text-paper hover:no-underline">
                Investigation
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-steel mt-16">
          <div className="mx-auto w-full max-w-[var(--container-content)] px-6 py-6 text-xs text-ash">
            Data sourced from the New Haven Livable City Initiative (Veoci) and CitySquared.
            Municipal is an independent public-records project. Not affiliated with the City of New Haven.
          </div>
        </footer>
      </body>
    </html>
  );
}
