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
      setScale(containerWidth < a4Px ? Math.min(1, (containerWidth - 8) / a4Px) : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
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
          transformOrigin: "top left",
          width: "210mm",
          marginBottom: `calc((${scale} - 1) * 297mm)`,
        } : {
          margin: "0 auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
