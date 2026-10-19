import { useEffect, useId, useRef, type ReactNode } from "react";
import { openPanel } from "../state/store";
import { Close } from "./icons";

export function Panel({ title, children, wide, note }: { title: string; children: ReactNode; wide?: boolean; note?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      ref={ref}
      className={`panel${wide ? " wide" : ""}`}
      role="dialog"
      aria-label={title}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          openPanel(null);
        }
      }}
    >
      <header className="panel-head">
        <h2 className="caps">{title}</h2>
        {note ? <span className="panel-note">{note}</span> : null}
        <button className="icon-btn" onClick={() => openPanel(null)} aria-label="Close panel">
          <Close size={18} />
        </button>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="section">
      <div className="section-head">
        <h3 className="caps">{title}</h3>
        {aside}
      </div>
      {children}
    </div>
  );
}

export function Fader({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  format = (v: number) => `${Math.round(v * 100)}`,
  ends,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  ends?: [string, string];
  disabled?: boolean;
}) {
  const id = useId();
  const p = ((value - min) / (max - min)) * 100;
  return (
    <div className={`fader${disabled ? " disabled" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--p": `${p}%` } as React.CSSProperties}
        aria-valuetext={ends ? `${format(value)} (${ends[0]} to ${ends[1]})` : format(value)}
      />
      <output htmlFor={id} className="tnum">
        {format(value)}
      </output>
      {ends ? (
        <span className="fader-ends caps" aria-hidden="true">
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </span>
      ) : null}
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="toggle">
      <label htmlFor={id}>
        <span>{label}</span>
        {hint ? <small>{hint}</small> : null}
      </label>
      <button id={id} role="switch" aria-checked={checked} className={`switch${checked ? " on" : ""}`} onClick={() => onChange(!checked)}>
        <i />
      </button>
    </div>
  );
}

export function Seg<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      <span className="seg-label">{label}</span>
      <div className="seg-row">
        {options.map((o) => (
          <button key={String(o.value)} role="radio" aria-checked={o.value === value} className={o.value === value ? "on" : ""} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
