/*
  Quality tiers for the chamber.
    low  — poster only, WebGL never mounts.
    mid  — DPR 1, no shadows, AgX tone mapping.
    high — DPR up to 1.75, shadows from the oculus light.
  The device guess here is only a starting point: the scene times its first frames and drops a tier
  (high → mid → low) when they are slow.
*/

export type Tier = "low" | "mid" | "high";
export type SceneTier = Exclude<Tier, "low">;

export const HIGH_DPR_MAX = 1.75;
/** Median frame time above this (≈ 28 fps) drops a tier. */
export const FRAME_BUDGET_MS = 36;

function webgl2Available(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** `?tier=low|mid|high` forces a tier on the prototype page, for checking each path by hand. */
function forced(): Tier | null {
  const t = new URLSearchParams(window.location.search).get("tier");
  return t === "low" || t === "mid" || t === "high" ? t : null;
}

export function detectTier(): Tier {
  const f = forced();
  if (f) return f === "low" || webgl2Available() ? f : "low";
  if (!webgl2Available()) return "low";

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory; // Chromium only, capped at 8
  if (nav.connection?.saveData) return "low";
  if (cores <= 2 || (memory !== undefined && memory <= 2)) return "low";
  if (cores >= 8 && (memory === undefined || memory >= 8)) return "high";
  return "mid";
}
