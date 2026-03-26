"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnParticle = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: 200 + Math.random() * 300,
      });
    };

    for (let i = 0; i < 80; i++) spawnParticle();

    const GRID_SIZE = 60;
    let tick = 0;

    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Animated grid
      const cols = Math.ceil(canvas.width / GRID_SIZE);
      const rows = Math.ceil(canvas.height / GRID_SIZE);
      for (let c = 0; c <= cols; c++) {
        for (let r = 0; r <= rows; r++) {
          const pulse =
            Math.sin((c + r + tick * 0.03) * 0.4) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(99,102,241,${pulse * 0.12})`;
          ctx.lineWidth = 0.5;
          // vertical
          ctx.beginPath();
          ctx.moveTo(c * GRID_SIZE, 0);
          ctx.lineTo(c * GRID_SIZE, canvas.height);
          ctx.stroke();
          // horizontal
          ctx.beginPath();
          ctx.moveTo(0, r * GRID_SIZE);
          ctx.lineTo(canvas.width, r * GRID_SIZE);
          ctx.stroke();
        }
      }

      // Particles
      particles = particles.filter((p) => p.life < p.maxLife);
      if (particles.length < 60) spawnParticle();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const progress = p.life / p.maxLife;
        const alpha = Math.sin(Math.PI * progress) * 0.7;
        const size = 1.5 + Math.sin(Math.PI * progress) * 1.5;

        const isBlue = p.life % 3 !== 0;
        ctx.fillStyle = isBlue
          ? `rgba(99,102,241,${alpha})`
          : `rgba(168,85,247,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.15;
            ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
