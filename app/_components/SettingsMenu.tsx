"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRightIcon, Settings2Icon } from "lucide-react";
import { LocaleSelect } from "@/app/_components/LocaleSelect";
import { ThemeToggle } from "@/app/_components/ThemeToggle";
import { getT, type AppLocale } from "@/lib/i18n";

type SettingsMenuProps = {
  locale: AppLocale;
};

export function SettingsMenu({ locale }: SettingsMenuProps) {
  const t = getT(locale);
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const panelTransition = reduceMotion
    ? { duration: 0.12 }
    : { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("radar.page.settings")}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 items-center justify-center rounded-[12px] border border-border bg-background text-foreground transition-colors hover:bg-muted"
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      >
        <motion.span animate={{ rotate: open && !reduceMotion ? 24 : 0 }} transition={{ duration: 0.18, ease: "easeOut" }}>
          <Settings2Icon className="size-4" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="settings-panel"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.985 }}
            transition={panelTransition}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-56 origin-top-right rounded-[16px] border border-border bg-card p-2.5 shadow-lg ring-1 ring-black/5"
          >
            <div className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("radar.page.settings")}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-[12px] px-1 py-1.5">
                <span className="text-sm text-foreground">{t("radar.page.language")}</span>
                <LocaleSelect value={locale} />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-[12px] px-1 py-1.5">
                <span className="text-sm text-foreground">{t("radar.page.theme")}</span>
                <ThemeToggle ariaLabel={t("radar.page.toggleTheme")} />
              </div>

              <a
                href="/api/v2/users/search?keyword=react"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted/45 px-3 py-1.5 text-xs font-medium text-foreground no-underline transition-colors hover:bg-muted"
              >
                <span>{t("radar.page.openApi")}</span>
                <ArrowUpRightIcon className="size-3.5 text-muted-foreground" />
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
