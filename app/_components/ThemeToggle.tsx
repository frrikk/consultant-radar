"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "flowcase-theme";
const THEME_EVENT = "flowcase-theme-change";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return document.documentElement.classList.contains("dark") || window.localStorage.getItem(STORAGE_KEY) === "dark";
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
