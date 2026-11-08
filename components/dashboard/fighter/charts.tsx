"use client";

// Two small SVG charts for the dashboard — a line trend and a two-profile radar — with a hover /
// touch tooltip. Hand-written instead of a chart library: Recharts alone is ~430 KB of client JS,
// over the evolve bundle gate (+5 %), for two charts on a mobile-first page.
// Marks: 2 px lines, ≥ 6 px dots with a 2 px surface ring, solid hairline grid, one axis.
import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";

const SURFACE = "#111113";
const GRID = "rgba(255,255,255,0.07)";
const TICK = "rgba(255,255,255,0.6)";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(Math.round(el.getBoundingClientRect().width));
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function Tip({ x, y, title, lines }: { x: number; y: number; title: string; lines: string[] }) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[10px] border border-white/10 bg-[#161618] px-2.5 py-1.5 text-[12px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      style={{ left: x, top: y - 10 }}
    >
      <p className="text-white/65">{title}</p>
      {lines.map((l) => <p key={l} className="font-semibold tabular-nums">{l}</p>)}
    </div>
  );
}

// ── Line trend ─────────────────────────────────────────────────────────────
export interface TrendDatum { label: string; value: number }

export function LineTrend({
  data, min = 0, max = 10, ticks = [0, 5, 10], height = 170, color = "#FF3B30", format = (v: number) => v.toFixed(1), seriesLabel,
}: {
  data: TrendDatum[]; min?: number; max?: number; ticks?: number[]; height?: number; color?: string;
  format?: (v: number) => string; seriesLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const m = { top: 8, right: 10, bottom: 22, left: 26 };
  const w = Math.max(0, width - m.left - m.right);
  const h = height - m.top - m.bottom;
  const x = (i: number) => m.left + (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w);
  const y = (v: number) => m.top + h - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * h;
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join("");
  const xLabels = data.length > 2 ? [0, Math.floor((data.length - 1) / 2), data.length - 1] : data.map((_, i) => i);

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    if (data.length === 0 || w <= 0) return;
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const i = data.length <= 1 ? 0 : Math.round((px / w) * (data.length - 1));
    setActive(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 ? (
        <svg width={width} height={height} role="presentation" aria-hidden className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + w} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={m.left - 8} y={y(t)} dy="0.35em" textAnchor="end" fontSize={11} fill={TICK}>{t}</text>
            </g>
          ))}
          {xLabels.map((i) => (
            <text key={i} x={x(i)} y={height - 4} fontSize={11} fill={TICK}
              textAnchor={i === 0 && data.length > 1 ? "start" : i === data.length - 1 && data.length > 1 ? "end" : "middle"}>
              {data[i]?.label}
            </text>
          ))}
          {active != null ? <line x1={x(active)} x2={x(active)} y1={m.top} y2={m.top + h} stroke="rgba(255,255,255,0.25)" strokeWidth={1} /> : null}
          <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d.value)} r={active === i ? 5 : 3} fill={color} stroke={SURFACE} strokeWidth={2} />
          ))}
          <rect x={m.left} y={0} width={w} height={height} fill="transparent"
            onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setActive(null)} />
        </svg>
      ) : null}
      {active != null && data[active] ? (
        <Tip x={x(active)} y={y(data[active].value)} title={data[active].label} lines={[`${seriesLabel}: ${format(data[active].value)}`]} />
      ) : null}
    </div>
  );
}

// ── Radar (two profiles, one 0..100 scale) ─────────────────────────────────
export interface RadarDatum { axis: string; you: number | null; ref: number }

export function RadarCompare({
  data, youLabel, refLabel, you = "#FF3B30", refColor = "rgba(255,255,255,0.62)", maxSize = 320,
}: { data: RadarDatum[]; youLabel: string; refLabel: string; you?: string; refColor?: string; maxSize?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const size = Math.min(width, maxSize);
  const c = size / 2;
  const r = Math.max(0, size / 2 - 62); // room for two-line axis labels on the sides
  const n = data.length;
  const ang = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const pt = (i: number, v: number) => [c + Math.cos(ang(i)) * r * (v / 100), c + Math.sin(ang(i)) * r * (v / 100)] as const;
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).map((k) => k.toFixed(1)).join(",")).join(" ");
  const left = (width - size) / 2;

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - box.left - c;
    const dy = e.clientY - box.top - c;
    if (Math.hypot(dx, dy) < 6) return;
    const a = Math.atan2(dy, dx) + Math.PI / 2;
    setActive(((Math.round((a / (Math.PI * 2)) * n) % n) + n) % n);
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height: size || 260 }}>
      {size > 0 ? (
        <svg width={size} height={size} role="presentation" aria-hidden className="absolute top-0 block overflow-visible" style={{ left }}>
          {[25, 50, 75, 100].map((lvl) => (
            <polygon key={lvl} points={poly(data.map(() => lvl))} fill="none" stroke={GRID} strokeWidth={1} />
          ))}
          {data.map((_, i) => {
            const [x2, y2] = pt(i, 100);
            return <line key={i} x1={c} y1={c} x2={x2} y2={y2} stroke={active === i ? "rgba(255,255,255,0.3)" : GRID} strokeWidth={1} />;
          })}
          <polygon points={poly(data.map((d) => d.ref))} fill="none" stroke={refColor} strokeWidth={1.5} strokeLinejoin="round" />
          <polygon points={poly(data.map((d) => d.you ?? 0))} fill={you} fillOpacity={0.22} stroke={you} strokeWidth={2} strokeLinejoin="round" />
          {data.map((d, i) => {
            if (d.you == null) return null;
            const [cx, cy] = pt(i, d.you);
            return <circle key={i} cx={cx} cy={cy} r={active === i ? 5 : 3} fill={you} stroke={SURFACE} strokeWidth={2} />;
          })}
          {data.map((d, i) => {
            const [lx, ly] = pt(i, 100);
            const cos = Math.cos(ang(i));
            const sin = Math.sin(ang(i));
            const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
            const words = d.axis.split(" ");
            const lines = words.length > 1 && d.axis.length > 8 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : [d.axis];
            const x = lx + cos * 8;
            const y = ly + sin * 10 - (lines.length - 1) * 6.5 * (Math.abs(sin) < 0.6 ? 1 : sin < 0 ? 2 : 0);
            return (
              <text key={d.axis} x={x} y={y} textAnchor={anchor} dominantBaseline={sin < -0.6 ? "auto" : sin > 0.6 ? "hanging" : "middle"}
                fontSize={11} fill={active === i ? "#fff" : "rgba(255,255,255,0.72)"}>
                {lines.map((l, k) => <tspan key={k} x={x} dy={k ? 13 : 0}>{l}</tspan>)}
              </text>
            );
          })}
          <rect x={0} y={0} width={size} height={size} fill="transparent"
            onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setActive(null)} />
        </svg>
      ) : null}
      {active != null && data[active] ? (() => {
        const d = data[active];
        const [tx, ty] = pt(active, Math.max(d.you ?? 0, d.ref));
        return <Tip x={left + tx} y={ty} title={d.axis} lines={[`${youLabel}: ${d.you ?? "—"}`, `${refLabel}: ${d.ref}`]} />;
      })() : null}
    </div>
  );
}
