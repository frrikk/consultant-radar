import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { defaultLocale, getT } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const t = getT();
const themeInitScript = `(function(){try{var stored=window.localStorage.getItem("flowcase-theme");var isDark=stored==="dark";document.documentElement.classList.toggle("dark",isDark);}catch(e){}})();`;

export const metadata: Metadata = {
  title: t("meta.title"),
  description: t("meta.description"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={defaultLocale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        {children}
      </body>
    </html>
  );
}
