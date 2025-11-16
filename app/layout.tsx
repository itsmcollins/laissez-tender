import type { Metadata } from "next";
import { Geist, Geist_Mono, EB_Garamond } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Laissez - Get agentic business done",
  description: "Let your agents do business with Laissez.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} antialiased`}
      >
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-80">
              <Image
                src="/laissez-logo.png"
                alt="Laissez"
                width={24}
                height={24}
                priority
              />
              <span className="font-secondary text-sm font-medium uppercase tracking-wider">
                LAISSEZ
              </span>
            </Link>
            <Link 
              href="/tenders" 
              className="font-secondary text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View Tenders
            </Link>
          </div>
        </header>
        <div className="pt-[57px]">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
