import React from "react";
import type { Slide, TemplateColors } from "./types";

interface Props {
  slide: Slide;
  index: number;
  total: number;
  colors: TemplateColors;
  isThumb?: boolean;
}

export default function SlideRenderer({ slide, index, total, colors, isThumb = false }: Props) {
  const fs = isThumb ? 0.3 : 1;
  const pad = isThumb ? "8px" : "60px";

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16/9",
        background: colors.bg,
        color: colors.text,
        display: "flex",
        flexDirection: "column",
        justifyContent: slide.layout === "title" ? "center" : "flex-start",
        alignItems: slide.layout === "title" ? "center" : "stretch",
        padding: pad,
        position: "relative",
        overflow: "hidden",
        borderRadius: isThumb ? "6px" : 0,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {slide.layout === "title" ? (
        <div style={{ textAlign: "center", maxWidth: "80%" }}>
          <h1 style={{ fontSize: `${2.6 * fs}em`, fontWeight: 800, marginBottom: `${0.4 * fs}em`, color: colors.accent, lineHeight: 1.15 }}>
            {slide.title}
          </h1>
          {slide.content && (
            <p style={{ fontSize: `${1.1 * fs}em`, opacity: 0.7, lineHeight: 1.5 }}>{slide.content}</p>
          )}
        </div>
      ) : slide.layout === "quote" ? (
        <>
          <h2 style={{ fontSize: `${1.4 * fs}em`, fontWeight: 700, marginBottom: `${0.5 * fs}em`, color: colors.accent }}>
            {slide.title}
          </h2>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: `${1.5 * fs}em` }}>
            <blockquote style={{ fontSize: `${1.4 * fs}em`, fontStyle: "italic", borderLeft: `4px solid ${colors.accent}`, paddingLeft: `${1 * fs}em`, opacity: 0.9, lineHeight: 1.6 }}>
              {slide.content}
            </blockquote>
          </div>
        </>
      ) : slide.layout === "two-columns" ? (
        <>
          <h2 style={{ fontSize: `${1.5 * fs}em`, fontWeight: 700, marginBottom: `${0.5 * fs}em`, color: colors.accent, borderBottom: `2px solid ${colors.accent}40`, paddingBottom: `${0.3 * fs}em` }}>
            {slide.title}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${1.5 * fs}em`, flex: 1 }}>
            {slide.content.split("\n").reduce<string[][]>((acc, line, i, arr) => {
              const mid = Math.ceil(arr.length / 2);
              if (i < mid) { if (!acc[0]) acc[0] = []; acc[0].push(line); }
              else { if (!acc[1]) acc[1] = []; acc[1].push(line); }
              return acc;
            }, []).map((col, ci) => (
              <div key={ci}>
                {col.map((line, li) => (
                  <p key={li} style={{ fontSize: `${0.9 * fs}em`, marginBottom: `${0.25 * fs}em`, lineHeight: 1.5, paddingLeft: line.startsWith("•") || line.startsWith("-") ? `${0.8 * fs}em` : 0 }}>
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: `${1.5 * fs}em`, fontWeight: 700, marginBottom: `${0.5 * fs}em`, color: colors.accent, borderBottom: `2px solid ${colors.accent}40`, paddingBottom: `${0.3 * fs}em` }}>
            {slide.title}
          </h2>
          <div style={{ display: "flex", gap: `${1 * fs}em`, flex: 1, alignItems: "flex-start" }}>
            {slide.layout === "image-left" && slide.image_url && (
              <img src={slide.image_url} alt="" style={{ width: "40%", borderRadius: "8px", objectFit: "cover", maxHeight: "70%" }} />
            )}
            <div style={{ flex: 1 }}>
              {slide.content.split("\n").map((line, li) => (
                <p key={li} style={{ fontSize: `${0.9 * fs}em`, marginBottom: `${0.25 * fs}em`, lineHeight: 1.6, paddingLeft: line.startsWith("•") || line.startsWith("-") ? `${0.8 * fs}em` : 0 }}>
                  {line}
                </p>
              ))}
            </div>
            {(slide.layout === "image-right" || slide.layout === "content") && slide.image_url && (
              <img src={slide.image_url} alt="" style={{ width: "40%", borderRadius: "8px", objectFit: "cover", maxHeight: "70%" }} />
            )}
          </div>
        </>
      )}

      {!isThumb && (
        <div style={{ position: "absolute", bottom: "12px", right: "20px", fontSize: "0.7em", opacity: 0.35 }}>
          {index + 1} / {total}
        </div>
      )}
    </div>
  );
}
