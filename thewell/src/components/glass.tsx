import { useId } from "react";
import type { Drink, GlassId } from "@/data/types";
import { dominantColor, liquidLayers } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, { w: number; h: number }> = {
  sm: { w: 64, h: 96 },
  md: { w: 78, h: 118 },
  lg: { w: 140, h: 210 },
  xl: { w: 200, h: 300 },
};

interface Shape {
  clip: string;
  outline: string;
  shine: string;
  foot?: string;
  rim?: string;
  fill?: string;
  metal?: boolean;
  box: { y: number; h: number };
}

const SHAPES: Record<GlassId, Shape> = {
  rocks: {
    clip: "M22 42 h56 v58 q0 8 -8 8 h-40 q-8 0 -8 -8 z",
    outline: "M20 40 h60 v60 q0 10 -10 10 h-40 q-10 0 -10 -10 z",
    shine: "M26 46 h6 v46 q0 4 -3 4 h-3 z",
    box: { y: 42, h: 66 },
  },
  "double-rocks": {
    clip: "M18 36 h64 v64 q0 8 -8 8 h-48 q-8 0 -8 -8 z",
    outline: "M16 34 h68 v66 q0 10 -10 10 h-48 q-10 0 -10 -10 z",
    shine: "M22 40 h7 v52 q0 4 -3 4 h-4 z",
    box: { y: 36, h: 72 },
  },
  coupe: {
    clip: "M18 38 C18 38 28 62 50 62 C72 62 82 38 82 38 C82 38 78 36 50 36 C22 36 18 38 18 38 Z",
    outline:
      "M16 36 C16 36 26 64 50 64 C74 64 84 36 84 36 C70 32 30 32 16 36 Z M50 64 v40 M32 112 q18 8 36 0",
    shine: "M28 40 q4 10 8 16 h3 q-6 -10 -8 -18 z",
    foot: "M32 112 q18 8 36 0",
    box: { y: 36, h: 26 },
  },
  martini: {
    clip: "M20 28 L50 68 L80 28 Z",
    outline: "M18 26 L50 70 L82 26 M50 70 v38 M34 116 q16 6 32 0",
    shine: "M30 32 l6 10 h3 l-7 -12 z",
    box: { y: 28, h: 40 },
  },
  "nick-nora": {
    clip: "M26 34 C26 34 32 64 50 64 C68 64 74 34 74 34 C68 32 32 32 26 34 Z",
    outline:
      "M24 32 C24 32 30 66 50 66 C70 66 76 32 76 32 C68 30 32 30 24 32 Z M50 66 v40 M34 114 q16 7 32 0",
    shine: "M34 38 q3 12 6 18 h3 q-4 -10 -6 -20 z",
    box: { y: 34, h: 32 },
  },
  highball: {
    clip: "M30 22 h40 v84 q0 6 -6 6 h-28 q-6 0 -6 -6 z",
    outline: "M28 20 h44 v88 q0 8 -8 8 h-28 q-8 0 -8 -8 z",
    shine: "M34 26 h5 v74 q0 3 -2 3 h-3 z",
    box: { y: 22, h: 90 },
  },
  collins: {
    clip: "M32 16 h36 v94 q0 6 -6 6 h-24 q-6 0 -6 -6 z",
    outline: "M30 14 h40 v98 q0 8 -8 8 h-24 q-8 0 -8 -8 z",
    shine: "M36 20 h5 v84 q0 3 -2 3 h-3 z",
    box: { y: 16, h: 100 },
  },
  flute: {
    clip: "M42 12 l8 0 c6 0 10 8 10 22 L58 70 h-16 L40 34 C40 20 36 12 42 12 Z",
    outline: "M40 10 h20 c8 0 12 10 12 24 L68 72 v2 H32 v-2 L36 34 C36 18 32 10 40 10 Z M50 74 v32 M36 114 q14 6 28 0",
    shine: "M44 18 h3 v40 h-3 z",
    box: { y: 12, h: 58 },
  },
  wine: {
    clip: "M30 22 C30 22 28 58 50 58 C72 58 70 22 70 22 C64 18 36 18 30 22 Z",
    outline:
      "M28 20 C28 20 26 60 50 60 C74 60 72 20 72 20 C64 16 36 16 28 20 Z M50 60 v46 M34 114 q16 7 32 0",
    shine: "M36 26 q2 16 4 24 h3 q-2 -12 -4 -26 z",
    box: { y: 22, h: 38 },
  },
  hurricane: {
    clip: "M36 16 C28 28 28 44 38 54 C28 66 30 86 42 94 h16 C70 86 72 66 62 54 C72 44 72 28 64 16 Z",
    outline:
      "M34 14 C24 28 24 46 36 56 C26 68 28 88 40 98 h20 C72 88 74 68 64 56 C76 46 76 28 66 14 Z",
    shine: "M40 22 q-2 14 2 28 h3 q-4 -16 -2 -30 z",
    box: { y: 16, h: 78 },
  },
  "copper-mug": {
    clip: "M24 36 h52 v62 q0 8 -10 8 h-32 q-10 0 -10 -8 z",
    outline: "M22 34 h56 v66 q0 10 -12 10 h-32 q-12 0 -12 -10 z M78 48 q16 6 16 22 q0 16 -16 22",
    shine: "M28 40 h6 v50 q0 4 -3 4 h-3 z",
    metal: true,
    fill: "#b87333",
    box: { y: 36, h: 70 },
  },
  julep: {
    clip: "M26 32 h48 v70 q0 8 -8 8 h-32 q-8 0 -8 -8 z",
    outline: "M24 30 h52 v74 q0 10 -10 10 h-32 q-10 0 -10 -10 z",
    shine: "M30 36 h6 v58 q0 3 -3 3 h-3 z",
    metal: true,
    fill: "#c0c4c8",
    box: { y: 32, h: 78 },
  },
  snifter: {
    clip: "M28 28 C22 48 28 70 50 70 C72 70 78 48 72 28 C66 22 34 22 28 28 Z",
    outline:
      "M26 26 C20 48 26 72 50 72 C74 72 80 48 74 26 C66 20 34 20 26 26 Z M50 72 v34 M36 114 q14 6 28 0",
    shine: "M34 32 q-2 16 2 28 h3 q-4 -14 -2 -30 z",
    box: { y: 28, h: 42 },
  },
  shot: {
    clip: "M32 48 h36 v40 q0 6 -6 6 h-24 q-6 0 -6 -6 z",
    outline: "M30 46 h40 v44 q0 8 -8 8 h-24 q-8 0 -8 -8 z",
    shine: "M36 52 h5 v30 q0 2 -2 2 h-3 z",
    box: { y: 48, h: 46 },
  },
  "irish-coffee": {
    clip: "M28 28 h44 v70 q0 8 -8 8 h-28 q-8 0 -8 -8 z",
    outline: "M26 26 h48 v74 q0 10 -10 10 h-28 q-10 0 -10 -10 z M74 48 q14 4 14 18 q0 14 -14 18",
    shine: "M32 32 h5 v58 q0 3 -2 3 h-3 z",
    box: { y: 28, h: 78 },
  },
  tiki: {
    clip: "M30 18 h40 l6 90 h-52 z",
    outline: "M28 16 h44 l8 94 h-60 z",
    shine: "M36 24 h5 v78 h-5 z",
    box: { y: 18, h: 90 },
  },
  pint: {
    clip: "M28 16 h44 l6 96 h-56 z",
    outline: "M26 14 h48 l8 100 h-64 z",
    shine: "M32 22 h6 v80 h-6 z",
    box: { y: 16, h: 96 },
  },
  margarita: {
    clip: "M18 30 L50 62 L82 30 L74 30 C70 42 58 48 50 48 C42 48 30 42 26 30 Z",
    outline:
      "M16 28 L50 64 L84 28 M50 64 v40 M34 112 q16 7 32 0",
    shine: "M28 32 l8 10 h3 l-9 -12 z",
    box: { y: 30, h: 32 },
  },
  mug: {
    clip: "M26 30 h48 v70 q0 8 -8 8 h-32 q-8 0 -8 -8 z",
    outline: "M24 28 h52 v74 q0 10 -10 10 h-32 q-10 0 -10 -10 z M76 44 q16 6 16 24 q0 18 -16 24",
    shine: "M30 34 h6 v58 q0 3 -3 3 h-3 z",
    box: { y: 30, h: 78 },
  },
};

function Garnish({ drink, color }: { drink: Drink; color: string }) {
  const g = drink.garnish.toLowerCase();
  if (g.includes("mint")) {
    return (
      <g>
        <ellipse cx="58" cy="28" rx="7" ry="12" fill="#3d8c5c" opacity="0.9" transform="rotate(-18 58 28)" />
        <ellipse cx="64" cy="24" rx="6" ry="11" fill="#4ea06c" opacity="0.95" transform="rotate(16 64 24)" />
        <ellipse cx="54" cy="22" rx="5" ry="10" fill="#2f7048" transform="rotate(-32 54 22)" />
      </g>
    );
  }
  if (g.includes("olive")) {
    return <ellipse cx="50" cy="46" rx="6" ry="4" fill="#6a7a3a" />;
  }
  if (g.includes("cherry")) {
    return (
      <g>
        <circle cx="58" cy="34" r="5" fill="#8a1020" />
        <path d="M58 29 q6 -10 10 -6" stroke="#2a1810" fill="none" strokeWidth="1" />
      </g>
    );
  }
  if (g.includes("salt")) {
    return <path d="M22 40 q28 -8 56 0" stroke={color} strokeWidth="2" fill="none" opacity="0.5" />;
  }
  if (g.includes("twist") || g.includes("peel") || g.includes("lemon") || g.includes("orange") || g.includes("lime")) {
    const peel = g.includes("orange") ? "#f08a20" : g.includes("lime") ? "#7cb342" : "#e8d44d";
    return <path d="M62 30 q14 8 6 20" stroke={peel} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
  }
  return null;
}

export function DrinkGlass({
  drink,
  size = "md",
  pour = false,
  className,
}: {
  drink: Drink;
  size?: Size;
  pour?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const clipId = `g${uid}`;
  const shape = SHAPES[drink.glass];
  const layers = liquidLayers(drink);
  const total = layers.reduce((s, l) => s + l.oz, 0) || 1;
  const dim = SIZE[size];
  const stroke = shape.metal ? "rgba(240,235,227,0.35)" : "rgba(240,235,227,0.55)";
  const glow = dominantColor(drink);

  const box = shape.box;
  let acc = 0;
  const rects = layers.map((layer, i) => {
    const h = (layer.oz / total) * box.h;
    const y = box.y + box.h - acc - h;
    acc += h;
    return { ...layer, y, h, i };
  });

  return (
    <svg
      viewBox="0 0 100 130"
      width={dim.w}
      height={dim.h}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={shape.clip} />
        </clipPath>
        <linearGradient id={`${clipId}-shine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${clipId}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="50" cy="122" rx="22" ry="4" fill="black" opacity="0.28" />
      {shape.metal ? (
        <path d={shape.outline} fill={shape.fill ?? "#b87333"} opacity="0.35" />
      ) : null}
      <g clipPath={`url(#${clipId})`} filter={`url(#${clipId}-glow)`}>
        <rect x="0" y="0" width="100" height="130" fill={glow} opacity="0.08" />
        {rects.map((r) => (
          <rect
            key={r.id + r.i}
            x="0"
            y={r.y}
            width="100"
            height={r.h}
            fill={r.color}
            opacity={r.foam ? 0.72 : 0.92}
            className={pour ? "pour-layer" : undefined}
            style={pour ? { animationDelay: `${r.i * 90}ms` } : undefined}
          />
        ))}
        <rect x="0" y="0" width="18" height="130" fill={`url(#${clipId}-shine)`} />
      </g>
      <path d={shape.outline} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
      <path d={shape.shine} fill="#fff" opacity="0.16" />
      {size !== "sm" ? <Garnish drink={drink} color={glow} /> : null}
    </svg>
  );
}

export function BottleMark({
  color,
  active,
  className,
}: {
  color: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 40 88" className={cn("overflow-visible", className)} aria-hidden="true">
      <path
        d="M14 8 h12 v10 q6 4 6 12 v48 q0 6 -6 6 h-12 q-6 0 -6 -6 V30 q0 -8 6 -12 z"
        fill={active ? color : "transparent"}
        stroke={active ? color : "rgba(240,235,227,0.28)"}
        strokeWidth="1.6"
        opacity={active ? 1 : 0.7}
      />
      <rect x="16" y="2" width="8" height="8" rx="1" fill={active ? color : "rgba(240,235,227,0.2)"} />
      {active ? <rect x="17" y="22" width="3" height="36" fill="#fff" opacity="0.22" /> : null}
    </svg>
  );
}
