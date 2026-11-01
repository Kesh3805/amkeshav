import type { Metadata } from "next";
import { Prototype } from "@/components/prototype/Prototype";

export const metadata: Metadata = {
  title: "Prototype",
  description: "Art-direction prototype: three rendered scenes joined by scroll.",
  robots: { index: false, follow: false },
};

export default function PrototypePage() {
  return (
    <>
      {/* The prototype is full-bleed; the site chrome would sit on top of the scenes. */}
      <style>{`header[data-header]{display:none}`}</style>
      <Prototype />
    </>
  );
}
