"use client";

import { useEffect, useRef } from "react";

interface FireworksCanvasProps {
  durationMs?: number;
}

export default function FireworksCanvas({
  durationMs = 2500,
}: FireworksCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame = 0;
    let running = true;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();

    window.addEventListener("resize", resize);

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
    };
    type Firework = {
      x: number;
      y: number;
      vy: number;
      exploded: boolean;
      color: string;
      particles: Particle[];
    };

    const fireworks: Firework[] = [];

    const random = (min: number, max: number) =>
      Math.random() * (max - min) + min;
    const colors = [
      "#60a5fa",
      "#22d3ee",
      "#a78bfa",
      "#f472b6",
      "#34d399",
      "#fbbf24",
    ];

    const spawn = () => {
      if (!running) return;
      const x = random(80, window.innerWidth - 80);
      const y = window.innerHeight + 10;
      const fw: Firework = {
        x,
        y,
        vy: random(-10, -14),
        exploded: false,
        color: colors[(Math.random() * colors.length) | 0],
        particles: [],
      };
      fireworks.push(fw);
      setTimeout(spawn, random(120, 260));
    };
    spawn();

    const explode = (fw: Firework) => {
      const count = (60 + Math.random() * 40) | 0;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = random(2, 5);
        fw.particles.push({
          x: fw.x,
          y: fw.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: fw.color,
        });
      }
    };

    const gravity = 0.08;
    const drag = 0.99;

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // background subtle alpha to create trails
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // update fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        if (!fw.exploded) {
          fw.y += fw.vy;
          fw.vy += gravity * 0.3;
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = fw.color;
          ctx.fill();
          if (fw.vy >= -1) {
            fw.exploded = true;
            explode(fw);
          }
        } else {
          // particles
          for (let p = fw.particles.length - 1; p >= 0; p--) {
            const part = fw.particles[p];
            part.vx *= drag;
            part.vy = part.vy * drag + gravity;
            part.x += part.vx;
            part.y += part.vy;
            part.alpha *= 0.985;

            if (part.alpha <= 0.02) {
              fw.particles.splice(p, 1);
              continue;
            }

            ctx.globalAlpha = part.alpha;
            ctx.fillStyle = part.color;
            ctx.fillRect(part.x, part.y, 2, 2);
            ctx.globalAlpha = 1;
          }

          if (fw.particles.length === 0) {
            fireworks.splice(i, 1);
          }
        }
      }

      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);

    const timeout = setTimeout(() => {
      running = false;
      cancelAnimationFrame(animationFrame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, durationMs);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrame);
      clearTimeout(timeout);
      window.removeEventListener("resize", resize);
    };
  }, [durationMs]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[60] pointer-events-none"
      aria-hidden="true"
    />
  );
}
