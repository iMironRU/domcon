import { useState, type ReactNode } from "react";
import { ImageIcon } from "lucide-react";
import type { Theme } from "../../schema/types";

interface Props {
  src: string;
  alt: string;
  theme: Theme;
  ratio?: string;
  rounded?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

/** Всегда выглядит намеренно: битое/пустое фото → стилизованный плейсхолдер. */
export function PhotoFrame({ src, alt, theme: t, ratio, rounded = true, onClick, children }: Props) {
  const [failed, setFailed] = useState(false);
  const show = Boolean(src) && !failed;
  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: ratio || t.photoRatio,
        borderRadius: rounded ? t.radius : 0,
        background: show ? "#e9e9e9" : `linear-gradient(135deg, ${t.accentSoft}, ${t.surface})`,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {show ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: t.muted }}>
          <ImageIcon size={22} strokeWidth={1.5} />
          <span style={{ fontSize: 12 }}>Фото готовятся</span>
        </div>
      )}
      {children}
    </div>
  );
}
