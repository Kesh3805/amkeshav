"use client";

/* eslint-disable react-hooks/immutability -- the R3F frame loop mutates three.js objects and shared drag state outside React render, which is the intended pattern. */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fixtureEdges, fixtureNodes } from "@/lib/fixture";

type Props = {
  base: boolean;
  colors: { ink: string; dim: string; signal: string };
  labels: React.RefObject<(HTMLElement | null)[]>;
  drag: React.RefObject<{ x: number; y: number; vx: number; vy: number; active: boolean }>;
  still: boolean;
};

const byId = new Map(fixtureNodes.map((n) => [n.id, n]));

function Graph({ base, colors, labels, drag, still }: Props) {
  const group = useRef<THREE.Group>(null);
  const removed = useRef(0);
  const { camera, size } = useThree();
  // Pull the camera back on narrow stages so the outer labels stay inside the frame.
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    camera.position.z = 10 * Math.max(1, 1.25 / aspect);
  }, [camera, size]);
  const v = useMemo(() => new THREE.Vector3(), []);

  const edgeGeo = useMemo(
    () =>
      fixtureEdges.map(([a, b]) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute([...byId.get(a)!.pos, ...byId.get(b)!.pos], 3));
        return { g, removed: b === "rm" };
      }),
    [],
  );

  const mats = useRef<Record<string, THREE.Material>>({});

  useFrame((_, dt) => {
    const g = group.current;
    const d = drag.current;
    if (!g || !d) return;
    // Inertia when released, slow drift when untouched.
    if (!d.active) {
      d.vx *= 0.94;
      d.vy *= 0.94;
      d.x += d.vx + (still ? 0 : dt * 0.06);
      d.y += d.vy;
    }
    d.y = Math.max(-0.7, Math.min(0.7, d.y));
    g.rotation.y = d.x;
    g.rotation.x = d.y;

    removed.current += ((base ? 1 : 0) - removed.current) * Math.min(1, dt * 7);
    const r = removed.current;
    const rmMat = mats.current.rm as THREE.MeshBasicMaterial | undefined;
    if (rmMat) rmMat.opacity = r;
    const rmEdge = mats.current.rmEdge as THREE.LineDashedMaterial | undefined;
    if (rmEdge) rmEdge.opacity = 0.7 * r;

    g.updateMatrixWorld();
    fixtureNodes.forEach((n, i) => {
      const el = labels.current?.[i];
      if (!el) return;
      v.set(...n.pos).applyMatrix4(g.matrixWorld).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = n.role === "removed" ? String(r) : "";
      el.style.zIndex = String(Math.round((1 - v.z) * 1000));
    });
  });

  return (
    <group ref={group}>
      {edgeGeo.map(({ g, removed: isRm }, i) =>
        isRm ? (
          <lineSegments key={i} geometry={g} onUpdate={(l) => l.computeLineDistances()}>
            <lineDashedMaterial
              ref={(m) => {
                if (m) mats.current.rmEdge = m;
              }}
              color={colors.ink}
              dashSize={0.12}
              gapSize={0.1}
              transparent
              opacity={0}
            />
          </lineSegments>
        ) : (
          <lineSegments key={i} geometry={g}>
            <lineBasicMaterial color={colors.ink} transparent opacity={0.55} />
          </lineSegments>
        ),
      )}
      {fixtureNodes.map((n) => {
        const s = n.role === "seed" ? 0.42 : n.role === "decoy" || n.role === "changed" ? 0.18 : 0.24;
        if (n.role === "removed") {
          return (
            <mesh key={n.id} position={n.pos}>
              <boxGeometry args={[s, s, s]} />
              <meshBasicMaterial
                ref={(m) => {
                  if (m) mats.current.rm = m;
                }}
                color={colors.ink}
                wireframe
                transparent
                opacity={0}
              />
            </mesh>
          );
        }
        return (
          <mesh key={n.id} position={n.pos}>
            <boxGeometry args={[s, s, s]} />
            <meshBasicMaterial
              color={n.role === "seed" ? colors.signal : n.role === "impacted" ? colors.ink : colors.dim}
              wireframe={n.role === "decoy"}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function GraphScene(props: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <Graph {...props} />
    </Canvas>
  );
}
