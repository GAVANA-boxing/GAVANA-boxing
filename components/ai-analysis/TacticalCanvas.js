"use client";

import { useEffect, useRef } from "react";

const CYAN = "#22D3EE";
const cA = (a) => `rgba(34,211,238,${a})`;

const NODES = [
  { id: "head", nx: 0.50, ny: 0.18 },
  { id: "lsho", nx: 0.36, ny: 0.38 },
  { id: "rsho", nx: 0.64, ny: 0.38 },
  { id: "core", nx: 0.50, ny: 0.58 },
  { id: "lhip", nx: 0.38, ny: 0.72 },
  { id: "rhip", nx: 0.62, ny: 0.72 },
];

const EDGES = [
  [0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 5],
];

/**
 * @param {{ active: boolean, width: number, height: number }} props
 */
export default function TacticalCanvas({ active, width, height }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const startRef = useRef(null);
  const opacityRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let running = true;

    function draw(ts) {
      if (!running) return;
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;

      const target = active ? 1 : 0;
      opacityRef.current += (target - opacityRef.current) * 0.08;
      const op = opacityRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (op < 0.01) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      const W = canvas.width;
      const H = canvas.height;

      // Scan line — sweeps every 12s
      const scanCycle = (elapsed % 12000) / 12000;
      const scanY = scanCycle * H;
      const grad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 8);
      grad.addColorStop(0, cA(0));
      grad.addColorStop(0.7, cA(0.06 * op));
      grad.addColorStop(1, cA(0.32 * op));
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 60, W, 68);

      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(W, scanY);
      ctx.strokeStyle = cA(0.55 * op);
      ctx.lineWidth = 1;
      ctx.stroke();

      const pts = NODES.map((n) => ({ x: n.nx * W, y: n.ny * H }));

      ctx.lineWidth = 1;
      ctx.strokeStyle = cA(0.28 * op);
      EDGES.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(pts[a].x, pts[a].y);
        ctx.lineTo(pts[b].x, pts[b].y);
        ctx.stroke();
      });

      pts.forEach((p, i) => {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed / 700 + i * 1.1);
        const r = 4 + pulse * 2;

        ctx.strokeStyle = cA(0.35 * op);
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(p.x - 10, p.y); ctx.lineTo(p.x - r - 2, p.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x + 10, p.y); ctx.lineTo(p.x + r + 2, p.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 10); ctx.lineTo(p.x, p.y - r - 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x, p.y + 10); ctx.lineTo(p.x, p.y + r + 2); ctx.stroke();

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        grd.addColorStop(0, cA(0.35 * op));
        grd.addColorStop(1, cA(0));
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = cA((0.7 + 0.3 * pulse) * op);
        ctx.fill();
      });

      const bSize = 16, bOff = 10;
      ctx.strokeStyle = cA(0.4 * op);
      ctx.lineWidth = 1.5;
      [[bOff, bOff, 1, 1], [W - bOff, bOff, -1, 1], [bOff, H - bOff, 1, -1], [W - bOff, H - bOff, -1, -1]].forEach(([x, y, sx, sy]) => {
        ctx.beginPath(); ctx.moveTo(x, y + sy * bSize); ctx.lineTo(x, y); ctx.lineTo(x + sx * bSize, y); ctx.stroke();
      });

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}
    />
  );
}
