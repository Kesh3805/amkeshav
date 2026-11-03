"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { detectTier, type SceneTier } from "./quality";
import s from "./Unwritten.module.css";

/*
  Poster first. The Cycles poster under this layer is the first paint and the permanent fallback; this
  layer mounts WebGL only after the page has loaded and the browser is idle, and stays transparent until
  the chamber has rendered real frames at its final tier. Any failure (no WebGL, reduced motion, low
  tier, a missing chamber.glb, a lost context) unmounts it and leaves the poster as it was.
*/

const ChamberScene = dynamic(() => import("./ChamberScene"), { ssr: false });

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export function ChamberLayer({ base }: { base: string }) {
  // The server snapshot says "reduced", so nothing WebGL-shaped is ever rendered on the server.
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => true,
  );
  const [tier, setTier] = useState<SceneTier | null>(null);
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (reduced) return;
    let gone = false;
    let idle = 0;
    const decide = () => {
      if (gone) return;
      const t = detectTier();
      if (t !== "low") setTier(t);
    };
    const start = () => {
      // Safari has no requestIdleCallback.
      idle = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(decide, { timeout: 2000 }) : window.setTimeout(decide, 250);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      gone = true;
      setLive(false); // a remount (reduced motion switched off again) fades in from the poster afresh
      window.removeEventListener("load", start);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [reduced]);

  const onReady = useCallback(() => setLive(true), []);
  const onFail = useCallback(() => setFailed(true), []);

  if (reduced || failed || !tier) return null;
  return (
    <div className={s.chamber} data-live={live ? "" : undefined} aria-hidden="true">
      <ChamberScene base={base} tier={tier} onReady={onReady} onFail={onFail} />
    </div>
  );
}
