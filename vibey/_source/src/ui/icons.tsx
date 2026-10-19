// Line icons drawn for Vibey: 20px grid, 1.5px stroke, square ends like silkscreened faceplate marks.

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

export const Play = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 4.5v11l9-5.5z" fill="currentColor" stroke="none" />
  </Svg>
);
export const Pause = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 4.5v11M13.5 4.5v11" strokeWidth={2.2} />
  </Svg>
);
export const Next = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 5v10l7-5z" fill="currentColor" stroke="none" />
    <path d="M14.5 5v10" strokeWidth={1.8} />
  </Svg>
);
export const Prev = (p: P) => (
  <Svg {...p}>
    <path d="M15.5 5v10l-7-5z" fill="currentColor" stroke="none" />
    <path d="M5.5 5v10" strokeWidth={1.8} />
  </Svg>
);
export const Shuffle = (p: P) => (
  <Svg {...p}>
    <path d="M3 6h3.5l7 8H17M3 14h3.5l2-2.3M11.5 8.3l2-2.3H17M15 4l2 2-2 2M15 12l2 2-2 2" />
  </Svg>
);
export const Repeat = ({ one, ...p }: P & { one?: boolean }) => (
  <Svg {...p}>
    <path d="M4 9V7.5A2.5 2.5 0 0 1 6.5 5H15M13 3l2 2-2 2M16 11v1.5a2.5 2.5 0 0 1-2.5 2.5H5M7 17l-2-2 2-2" />
    {one ? <path d="M10 8v4.5" strokeWidth={1.4} /> : null}
  </Svg>
);
export const Star = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M10 3l2.1 4.5 4.9.6-3.6 3.3 1 4.8L10 13.8 5.6 16.2l1-4.8L3 8.1l4.9-.6z" fill={filled ? "currentColor" : "none"} strokeLinejoin="round" />
  </Svg>
);
export const Close = (p: P) => (
  <Svg {...p}>
    <path d="M5 5l10 10M15 5L5 15" />
  </Svg>
);
export const Speaker = ({ muted, ...p }: P & { muted?: boolean }) => (
  <Svg {...p}>
    <path d="M3.5 8v4h3l4 3.5v-11L6.5 8z" fill="currentColor" stroke="none" />
    {muted ? <path d="M13.5 8l4 4M17.5 8l-4 4" /> : <path d="M13.5 7.5c1.2 1.4 1.2 3.6 0 5M15.5 5.5c2.4 2.6 2.4 6.4 0 9" />}
  </Svg>
);
export const Expand = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 7.5v-4h4M16.5 7.5v-4h-4M3.5 12.5v4h4M16.5 12.5v4h-4" />
  </Svg>
);
export const Dice = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
    <circle cx="7.3" cy="7.3" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12.7" cy="12.7" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="10" cy="10" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
);
export const Chevron = ({ dir = "right", ...p }: P & { dir?: "left" | "right" | "up" | "down" }) => {
  const d = { right: "M8 5l5 5-5 5", left: "M12 5l-5 5 5 5", up: "M5 12l5-5 5 5", down: "M5 8l5 5 5-5" }[dir];
  return (
    <Svg {...p}>
      <path d={d} />
    </Svg>
  );
};
export const Plus = (p: P) => (
  <Svg {...p}>
    <path d="M10 4v12M4 10h12" />
  </Svg>
);
export const Trash = (p: P) => (
  <Svg {...p}>
    <path d="M4 6h12M8 6V4h4v2M5.5 6l.8 10h7.4l.8-10" />
  </Svg>
);
