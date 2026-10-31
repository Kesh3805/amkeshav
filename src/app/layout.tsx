import type { Metadata, Viewport } from "next";
import { Anybody, JetBrains_Mono, Newsreader } from "next/font/google";
import { Footer } from "@/components/chrome/Footer";
import { Header } from "@/components/chrome/Header";
import { site } from "@/lib/site";
import "./globals.css";

const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s — Keshav" },
  description: site.description,
  openGraph: { title: site.title, description: site.description, url: site.url, siteName: "Keshav", type: "website" },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ecebe4" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0d" },
  ],
};

// Runs before first paint so the stored theme never flashes.
const themeScript = `(function(){document.documentElement.classList.add('js');try{var s=localStorage.getItem('theme');var t=s||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light'}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${anybody.variable} ${newsreader.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
