"use client";

import { useEffect } from "react";

/* Hides the header while reading downward and brings it back on any upward scroll. */
export function HeaderMotion() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-header]");
    if (!header) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > last + 4;
      const up = y < last - 4;
      if (down && y > 120) header.dataset.hidden = "true";
      else if (up || y < 120) header.dataset.hidden = "false";
      last = y;
    };
    const onFocus = () => (header.dataset.hidden = "false");
    window.addEventListener("scroll", onScroll, { passive: true });
    header.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      header.removeEventListener("focusin", onFocus);
    };
  }, []);
  return null;
}
