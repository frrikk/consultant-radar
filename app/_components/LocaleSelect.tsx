"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type AppLocale } from "@/lib/i18n";

type LocaleSelectProps = {
  value: AppLocale;
};

const localeLabels: Record<AppLocale, string> = {
  no: "Norsk",
  en: "English",
};

export function LocaleSelect({ value }: LocaleSelectProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleValueChange(nextLocale: AppLocale | null) {
    if (!nextLocale || typeof window === "undefined") {
      return;
    }

    const pathSegments = pathname.split("/").filter(Boolean);
    const restSegments = pathSegments.length > 0 ? pathSegments.slice(1) : [];
    const targetPath = `/${nextLocale}${restSegments.length > 0 ? `/${restSegments.join("/")}` : ""}`;
    const query = searchParams.toString();

    window.location.assign(query ? `${targetPath}?${query}` : targetPath);
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger size="sm" className="w-[112px] rounded-[12px] bg-background text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(localeLabels).map(([locale, label]) => (
          <SelectItem key={locale} value={locale}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
