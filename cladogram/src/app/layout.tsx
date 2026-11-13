import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Bodoni_Moda, Spectral, IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import { ReadingLevelProvider } from "@/lib/readingLevel";
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

const display = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const body = Spectral({ subsets: ["latin"], weight: ["300", "400", "600"], style: ["normal", "italic"], variable: "--font-body", display: "swap" });
const label = IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-label", display: "swap" });

export const metadata: Metadata = {
  // Relative URLs in page metadata (canonicals, share images) resolve against the live site.
  metadataBase: new URL(`${SITE_URL}/`),
  title: { template: `%s | ${SITE_NAME}`, default: `${SITE_NAME}: the history and DNA of dog breeds` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_US", images: ["og/home.png"] },
  twitter: { card: "summary_large_image" },
  // Paste the Search Console token into NEXT_PUBLIC_GSC_VERIFICATION to verify ownership.
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } } : {}),
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  author: AUTHOR,
  publisher: { "@type": "Person", name: AUTHOR.name, sameAs: [AUTHOR.url] },
};

export const viewport: Viewport = { themeColor: "#0d1110" };

// Google Analytics (gtag.js). Page changes inside the site are counted by GA4's
// enhanced measurement ("page changes based on browser history events").
const GA_ID = "G-C0J6DE3KL8";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${label.variable}`}>
      <body>
        <JsonLd data={WEBSITE_LD} />
        <ReadingLevelProvider>
          {children}
          <SiteFooter />
        </ReadingLevelProvider>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
