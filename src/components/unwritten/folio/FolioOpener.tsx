"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { anchorFor, FRONTIER_BOOK, NARROW_QUERY, posterPoint } from "../chamberCamera";
import s from "./Folio.module.css";
import u from "../Unwritten.module.css";

/*
  The FRONTIER volume on the reading desk. An invisible hotspot sits over the book wherever the poster's
  cover crop puts it; pressing it opens the folio (the children: one DOM, rendered on the server) in a
  modal <dialog> with no mask. On wide screens the spread starts as the closed book lying on the desk
  plane, the board lifts on its hinge, and the whole spread rises to a flat reading orientation while the
  chamber behind racks out of focus. Reduced motion, narrow screens and the #frontier deep link open flat
  with a fade. Esc, the close control or a click on the bare stage closes it; focus returns to the hotspot.
*/

const HASH = "#frontier";
const WIDE_MOTION = "(min-width: 901px) and (prefers-reduced-motion: no-preference)";

type Mode = "3d" | "flat";
type Geo = { x: number; y: number; w: number; h: number; book: number };

const RISE_MS = 1700;
const BOARD_DELAY = 260;
const BOARD_MS = 1150;
const CLOSE_SPEED = 0.8;

const boardFrames: Keyframe[] = [
  // Heavy to lift, then it falls open under its own weight and settles with a small bounce.
  { transform: "rotateY(180deg)", offset: 0, easing: "cubic-bezier(0.55, 0, 0.65, 1)" },
  { transform: "rotateY(92deg)", offset: 0.55, easing: "cubic-bezier(0.45, 0, 1, 1)" },
  { transform: "rotateY(0deg)", offset: 0.84, easing: "cubic-bezier(0, 0, 0.4, 1)" },
  { transform: "rotateY(2.5deg)", offset: 0.92, easing: "cubic-bezier(0.6, 0, 1, 1)" },
  { transform: "rotateY(0deg)", offset: 1 },
];

const sheenFrames: Keyframe[] = [
  { opacity: 0, backgroundPosition: "100% 0" },
  { opacity: 1, offset: 0.45 },
  { opacity: 0, backgroundPosition: "0% 0" },
];

export function FolioOpener({ children }: { children: ReactNode }) {
  const hotspot = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const anims = useRef<Animation[]>([]);
  const closing = useRef(false);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);

  // Track the book's on-screen position through the poster's cover crop.
  useEffect(() => {
    const frame = hotspot.current?.parentElement;
    if (!frame) return;
    const narrow = window.matchMedia(NARROW_QUERY);
    const measure = () => {
      const p = posterPoint(FRONTIER_BOOK.x, FRONTIER_BOOK.y, frame.clientWidth, frame.clientHeight, anchorFor(narrow.matches));
      const book = FRONTIER_BOOK.width * p.scale;
      setGeo({ x: p.x, y: p.y, w: Math.max(44, book * 1.7), h: Math.max(44, book * 1.1), book });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    narrow.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      narrow.removeEventListener("change", measure);
    };
  }, []);

  const setFrameState = (on: boolean) => markFrame(hotspot.current?.parentElement, on);

  const open = useCallback((m: Mode) => {
    closing.current = false;
    setMode(m);
  }, []);

  const finishClose = useCallback(() => {
    anims.current.forEach((a) => a.cancel());
    anims.current = [];
    dialog.current?.removeAttribute("data-closing");
    if (dialog.current?.open) dialog.current.close();
    setMode(null);
    closing.current = false;
    if (window.location.hash === HASH) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    hotspot.current?.focus({ preventScroll: true });
  }, []);

  const close = useCallback(() => {
    const d = dialog.current;
    if (!d || !d.open || closing.current) return;
    closing.current = true;
    setFrameState(false);
    const running = anims.current.filter((a) => a.playState === "running");
    if (running.length) {
      // Closed mid-flight: play the same motion back from where it is.
      running.forEach((a) => a.reverse());
      Promise.all(running.map((a) => a.finished)).then(finishClose, finishClose);
      return;
    }
    if (mode === "3d") {
      const back = play(d, geo, true);
      anims.current = back;
      Promise.all(back.map((a) => a.finished)).then(finishClose, finishClose);
      return;
    }
    d.setAttribute("data-closing", "");
    window.setTimeout(finishClose, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220);
  }, [finishClose, geo, mode]);

  // Open: showModal, focus the title, rack the chamber out of focus, and (3D) play the rise.
  useEffect(() => {
    const d = dialog.current;
    if (!mode || !d || d.open) return;
    d.showModal();
    d.scrollTop = 0;
    setFrameState(true);
    if (window.location.hash !== HASH) window.history.replaceState(null, "", HASH);
    d.querySelector<HTMLElement>("[data-folio-spread] h2")?.focus({ preventScroll: true });
    if (mode === "3d") anims.current = play(d, geo, false);
    // geo is read once, at the moment of opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Deep link and manual hash edits: #frontier opens flat; dropping it closes.
  useEffect(() => {
    const sync = () => {
      if (window.location.hash === HASH) {
        if (!dialog.current?.open) open("flat");
      } else if (dialog.current?.open) close();
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [open, close]);

  const onHotspot = () => open(!window.matchMedia(NARROW_QUERY).matches && window.matchMedia(WIDE_MOTION).matches ? "3d" : "flat");

  return (
    <>
      <button
        ref={hotspot}
        type="button"
        className={u.hotspot}
        aria-label="Open the FRONTIER volume"
        aria-haspopup="dialog"
        data-hint="Frontier · exp-009"
        style={geo ? { left: geo.x - geo.w / 2, top: geo.y - geo.h / 2, width: geo.w, height: geo.h } : { visibility: "hidden" }}
        onClick={onHotspot}
      />
      <dialog
        ref={dialog}
        className={s.stage}
        data-folio-mode={mode ?? undefined}
        aria-label="FRONTIER, exp-009"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <button type="button" className={s.close} onClick={close}>
          Close
        </button>
        {children}
      </dialog>
    </>
  );
}

/** The chamber's frame racks out of focus while the folio is open (Unwritten.module.css). */
function markFrame(frame: HTMLElement | null | undefined, on: boolean) {
  if (!frame) return;
  if (on) frame.setAttribute("data-folio", "");
  else frame.removeAttribute("data-folio");
}

/** The rise from the desk (or, reversed, the return to it). Measured against the spread's final layout. */
function play(d: HTMLDialogElement, geo: Geo | null, reverse: boolean): Animation[] {
  const spread = d.querySelector<HTMLElement>("[data-folio-spread]");
  const board = d.querySelector<HTMLElement>("[data-folio-board]");
  if (!spread || !board || !geo) return [];
  const r = spread.getBoundingClientRect();
  const frame = d.ownerDocument.querySelector(`.${u.frame}`)?.getBoundingClientRect() ?? { left: 0, top: 0 };
  const bookX = frame.left + geo.x;
  const bookY = frame.top + geo.y;
  // Shut, the volume is one page wide (the right page under the board); scale it to the book on the desk.
  const s0 = Math.max(0.02, geo.book / (r.width / 2));
  const tx = bookX - (r.left + r.width / 2) - (r.width / 4) * s0;
  const ty = bookY - (r.top + r.height / 2);
  const speed = reverse ? CLOSE_SPEED : 1;
  const timing = (duration: number, delay: number): KeyframeAnimationOptions => ({
    duration: duration * speed,
    delay: delay * speed,
    fill: "both",
    direction: reverse ? "reverse" : "normal",
  });
  const boardDelay = reverse ? RISE_MS - BOARD_DELAY - BOARD_MS : BOARD_DELAY;
  const out = [
    spread.animate(
      [
        { transform: `translate(${tx}px, ${ty}px) scale3d(${s0}, ${s0}, ${s0}) rotateX(78deg)`, easing: "cubic-bezier(0.5, 0, 0.15, 1)" },
        { transform: "translate(0px, 0px) scale3d(1, 1, 1) rotateX(0deg)" },
      ],
      timing(RISE_MS, 0),
    ),
    board.animate(boardFrames, timing(BOARD_MS, boardDelay)),
    // The contact shadow is the open spread's; it grows in with the board instead of lying under nothing.
    ...[...spread.querySelectorAll<HTMLElement>("[data-folio-shadow]")].map((el) =>
      el.animate([{ opacity: 0 }, { opacity: 0.25, offset: 0.6 }, { opacity: 1 }], timing(BOARD_MS, boardDelay)),
    ),
    ...[...spread.querySelectorAll<HTMLElement>("[data-folio-sheen]")].map((el) => el.animate(sheenFrames, timing(BOARD_MS, boardDelay))),
  ];
  // Once open, drop the fills so the text renders flat and crisp with no residual 3D transform.
  if (!reverse) Promise.all(out.map((a) => a.finished)).then(() => out.forEach((a) => a.cancel()), () => {});
  return out;
}
