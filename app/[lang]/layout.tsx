import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { defaultLocale, getT, isAppLocale, locales, type AppLocale } from "@/lib/i18n";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeInitScript = `(function(){try{var stored=window.localStorage.getItem("flowcase-theme");var isDark=stored==="dark";document.documentElement.classList.toggle("dark",isDark);}catch(e){}})();`;

type LangLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

function resolveRouteLocale(lang: string): AppLocale {
  return isAppLocale(lang) ? lang : defaultLocale;
}

export async function generateMetadata({ params }: LangLayoutProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = resolveRouteLocale(lang);
  const t = getT(locale);

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;
  const locale = resolveRouteLocale(lang);

  return (
    <html
      lang={locale}
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
