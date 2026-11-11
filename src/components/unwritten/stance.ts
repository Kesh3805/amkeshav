/*
  The chamber's three stances (ruling B): Threshold (the poster's CAM_HERO) → Desk → Book, on one authored
  track. The live WebGL scene registers itself as the driver; the folio asks it to fly to the book before
  opening and back to the threshold after closing. With no driver (poster only: no WebGL, reduced motion,
  narrow screens, a missing model) every request resolves to null at once and the folio opens as before.
*/

export type Stance = "threshold" | "book";

/** The book as the camera sees it on arrival, in px within the chamber's frame; `tilt` is the rotateX
    (degrees) that lays a flat page onto the desk plane as seen from there. */
export type BookView = { x: number; y: number; book: number; tilt: number };

type Driver = (to: Stance) => Promise<BookView | null>;

let driver: Driver | null = null;

/** Registers the scene's driver; returns the unregister function. */
export function setStanceDriver(d: Driver): () => void {
  driver = d;
  return () => {
    if (driver === d) driver = null;
  };
}

/** True while the live chamber can fly; false on the poster. */
export const canFly = () => driver !== null;

export function goToStance(to: Stance): Promise<BookView | null> {
  return driver ? driver(to) : Promise.resolve(null);
}
