"use client";

import { useSyncExternalStore } from "react";
import s from "./Header.module.css";

type Theme = "light" | "dark";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

const read = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={s.toggle}
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("theme", next);
        } catch {}
      }}
    >
      <span className={s.toggleTrack} data-theme={theme} aria-hidden>
        <span className={s.toggleKnob} />
      </span>
      <span className={s.toggleText}>{theme === "dark" ? "Ink" : "Paper"}</span>
    </button>
  );
}
