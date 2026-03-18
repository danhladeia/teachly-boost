import { useEffect, useRef, useState } from "react";

interface ResponsiveA4WrapperProps {
  children: React.ReactNode;
  printAreaId?: string;
}

/**
 * Wraps any A4-fixed-width content and applies scale-to-fit on smaller screens.
 * Use around GameA4Shell, PlanoPreview, exam previews, etc.
 */
export default function ResponsiveA4Wrapper({ children, printAreaId }: ResponsiveA4WrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;

      const containerWidth = el.clientWidth;
      const a4Px = 793.7; // 210mm at 96dpi
      const safeWidth = containerWidth - 16;

      if (containerWidth < 64) return;

      const nextScale = safeWidth < a4Px ? safeWidth / a4Px : 1;
      setScale(Number.isFinite(nextScale) ? Math.max(0.25, Math.min(1, nextScale)) : 1);
    };

    update();

    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);

    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-x-hidden max-w-full">
      <style>{`
        .responsive-a4-inner img,
        .responsive-a4-inner table {
          max-width: 100% !important;
          height: auto !important;
        }
        .responsive-a4-inner {
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
      `}</style>
      <div
        className="responsive-a4-inner"
        style={scale < 1 ? {
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          width: "210mm",
          maxWidth: "none",
          margin: "0 auto",
          marginBottom: `calc((${scale} - 1) * 297mm)`,
          willChange: "transform",
        } : {
          margin: "0 auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
