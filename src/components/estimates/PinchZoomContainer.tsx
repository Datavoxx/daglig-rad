import { useRef, useState, useCallback, type ReactNode, type TouchEvent } from "react";

interface Transform {
  scale: number;
  x: number;
  y: number;
}

interface PinchZoomContainerProps {
  children: ReactNode;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

export function PinchZoomContainer({
  children,
  minScale = 0.38,
  maxScale = 1.5,
  initialScale = 0.48,
}: PinchZoomContainerProps) {
  const [transform, setTransform] = useState<Transform>({
    scale: initialScale,
    x: 0,
    y: 0,
  });

  const startRef = useRef<{
    touches: { x: number; y: number }[];
    transform: Transform;
    dist: number;
    midX: number;
    midY: number;
  } | null>(null);

  const lastTapRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getTouchPoints = (e: TouchEvent) =>
    Array.from(e.touches).map((t) => ({ x: t.clientX, y: t.clientY }));

  const getDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const clampTransform = useCallback(
    (t: Transform): Transform => {
      const s = Math.min(maxScale, Math.max(minScale, t.scale));
      // Allow panning but keep content partially visible
      const maxPanX = 200 * s;
      const maxPanY = 200 * s;
      return {
        scale: s,
        x: Math.min(maxPanX, Math.max(-maxPanX, t.x)),
        y: Math.min(maxPanY, Math.max(-maxPanY, t.y)),
      };
    },
    [minScale, maxScale]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const points = getTouchPoints(e);
      if (points.length === 1) {
        // Check for double-tap
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          // Double-tap: toggle between initialScale and 1.0
          setTransform((prev) => {
            const targetScale = prev.scale > initialScale + 0.1 ? initialScale : 1.0;
            return { scale: targetScale, x: 0, y: 0 };
          });
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
      }

      const dist = points.length >= 2 ? getDistance(points[0], points[1]) : 0;
      const midX = points.length >= 2 ? (points[0].x + points[1].x) / 2 : points[0].x;
      const midY = points.length >= 2 ? (points[0].y + points[1].y) / 2 : points[0].y;

      startRef.current = {
        touches: points,
        transform: { ...transform },
        dist,
        midX,
        midY,
      };
    },
    [transform, initialScale]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const start = startRef.current;
      if (!start) return;

      const points = getTouchPoints(e);

      if (points.length >= 2 && start.touches.length >= 2) {
        // Pinch zoom
        const newDist = getDistance(points[0], points[1]);
        const ratio = newDist / (start.dist || 1);
        const newScale = start.transform.scale * ratio;

        // Pan from midpoint movement
        const newMidX = (points[0].x + points[1].x) / 2;
        const newMidY = (points[0].y + points[1].y) / 2;
        const dx = newMidX - start.midX;
        const dy = newMidY - start.midY;

        setTransform(
          clampTransform({
            scale: newScale,
            x: start.transform.x + dx,
            y: start.transform.y + dy,
          })
        );
      } else if (points.length === 1 && start.touches.length >= 1) {
        // Single-finger pan (only when zoomed in)
        if (transform.scale > initialScale + 0.05) {
          const dx = points[0].x - start.touches[0].x;
          const dy = points[0].y - start.touches[0].y;
          setTransform(
            clampTransform({
              ...start.transform,
              x: start.transform.x + dx,
              y: start.transform.y + dy,
            })
          );
        }
      }
    },
    [clampTransform, transform.scale, initialScale]
  );

  const handleTouchEnd = useCallback(() => {
    startRef.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden relative w-full h-full"
      style={{ touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="origin-top-left will-change-transform"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transition: startRef.current ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}

