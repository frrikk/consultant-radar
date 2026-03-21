import i18next from "i18next";
import enCommon from "@/locales/en/common.json";
import noCommon from "@/locales/no/common.json";

export const locales = ["no", "en"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "no";

const resources = {
  en: { common: enCommon },
  no: { common: noCommon },
} as const;

const i18n = i18next.createInstance();

void i18n.init({
  resources,
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  supportedLngs: [...locales],
  defaultNS: "common",
  ns: ["common"],
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  initImmediate: false,
});

const consultantTitleKeyMap = {
  Consultant: "consultant",
  "Senior Consultant": "seniorConsultant",
} as const;

export function getT(locale: AppLocale = defaultLocale) {
  return i18n.getFixedT(locale, "common");
}

export function isAppLocale(value: string | undefined): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export function resolveLocale(value: string | string[] | undefined): AppLocale {
  const candidate = Array.isArray(value) ? value[0] : value;
  return isAppLocale(candidate) ? candidate : defaultLocale;
}

export function translateConsultantTitle(value: string, locale: AppLocale = defaultLocale) {
  const key = consultantTitleKeyMap[value as keyof typeof consultantTitleKeyMap];
  if (!key) {
    return value;
  }

  return getT(locale)(`titles.${key}`);
}

export function formatLocaleDate(value: string | Date, locale: AppLocale = defaultLocale) {
  const languageTag = locale === "no" ? "nb-NO" : "en-GB";
  return new Intl.DateTimeFormat(languageTag, { dateStyle: "medium" }).format(new Date(value));
}

export function formatLocaleShortDate(value: string | Date, locale: AppLocale = defaultLocale) {
  const languageTag = locale === "no" ? "nb-NO" : "en-GB";
  return new Intl.DateTimeFormat(languageTag, { dateStyle: "short" }).format(new Date(value));
}
