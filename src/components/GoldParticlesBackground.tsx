import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  driftAmp: number;
  driftFreq: number;
  phase: number;
  baseAlpha: number;
  twinkleSpeed: number;
  softGlow: boolean;
}

interface GoldParticlesBackgroundProps {
  density?: 'sparse' | 'normal';
  tone?: 'dark' | 'light' | 'adaptive';
  globalBackdrop?: boolean;
  className?: string;
}

export function GoldParticlesBackground({
  density = 'sparse',
  tone = 'adaptive',
  globalBackdrop = false,
  className = '',
}: GoldParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let rafId = 0;
    let isVisible = true;
    let isTabActive = document.visibilityState === 'visible';
    let lastTime = performance.now();

    const buildParticles = (w: number, h: number): Particle[] => {
      const area = w * h;
      const baseCount =
        density === 'normal'
          ? Math.round(area / 26000)
          : Math.round(area / 48000);
      const count =
        density === 'normal'
          ? Math.max(26, Math.min(54, baseCount))
          : Math.max(14, Math.min(28, baseCount));

      return Array.from({ length: count }, (_, i) => {
        const isBokeh = i % 4 === 0;
        const baseAlpha =
          tone === 'dark'
            ? isBokeh
              ? 0.28 + Math.random() * 0.22
              : 0.34 + Math.random() * 0.36
            : tone === 'adaptive'
            ? isBokeh
              ? 0.22 + Math.random() * 0.16
              : 0.26 + Math.random() * 0.24
            : 0.2 + Math.random() * 0.22;

        return {
          x: Math.random() * w,
          y: Math.random() * h,
          radius: isBokeh ? 2.2 + Math.random() * 2.2 : 1.0 + Math.random() * 1.35,
          speedY: 7 + Math.random() * 12,
          driftAmp: 7 + Math.random() * 16,
          driftFreq: 0.25 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
          baseAlpha,
          twinkleSpeed: 0.65 + Math.random() * 1.05,
          softGlow: isBokeh,
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      if (globalBackdrop) {
        width = Math.max(1, window.innerWidth);
        height = Math.max(1, window.innerHeight);
      } else {
        const parent = canvas.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        width = Math.max(1, Math.floor(rect.width));
        height = Math.max(1, Math.floor(rect.height));
      }
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = buildParticles(width, height);
    };

    const drawFrame = (now: number) => {
      if (!isVisible || !isTabActive) {
        rafId = 0;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = now * 0.001;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speedY * dt;
        if (p.y < -14) {
          p.y = height + 14;
          p.x = Math.random() * width;
        }

        const renderX = p.x + Math.sin(t * p.driftFreq + p.phase) * p.driftAmp;
        const twinkle = 0.65 + 0.35 * Math.sin(t * p.twinkleSpeed + p.phase);
        const alpha = p.baseAlpha * twinkle;

        if (p.softGlow) {
          const glowRadius = p.radius * 3.4;
          const grad = ctx.createRadialGradient(
            renderX,
            p.y,
            0,
            renderX,
            p.y,
            glowRadius
          );
          grad.addColorStop(0, `rgba(218, 178, 96, ${alpha})`);
          grad.addColorStop(0.55, `rgba(201, 164, 92, ${alpha * 0.4})`);
          grad.addColorStop(1, 'rgba(201, 164, 92, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(renderX, p.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle =
            tone === 'dark'
              ? `rgba(220, 186, 114, ${alpha})`
              : tone === 'adaptive'
              ? `rgba(196, 152, 68, ${alpha})`
              : `rgba(168, 132, 62, ${alpha})`;
          ctx.beginPath();
          ctx.arc(renderX, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = window.requestAnimationFrame(drawFrame);
    };

    const startLoop = () => {
      if (!rafId && isVisible && isTabActive) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    const stopLoop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    resize();

    let resizeObserver: ResizeObserver | null = null;
    if (globalBackdrop) {
      window.addEventListener('resize', resize);
    } else if (canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas.parentElement);
    }

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = Boolean(entries[0]?.isIntersecting);
        if (isVisible) startLoop();
        else stopLoop();
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(canvas);

    const handleVisibilityChange = () => {
      isTabActive = document.visibilityState === 'visible';
      if (isTabActive) startLoop();
      else stopLoop();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    startLoop();

    return () => {
      stopLoop();
      if (globalBackdrop) {
        window.removeEventListener('resize', resize);
      }
      resizeObserver?.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [density, globalBackdrop, prefersReducedMotion, tone]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={
        globalBackdrop
          ? `fixed inset-0 w-screen h-screen pointer-events-none select-none z-20 ${className}`
          : `absolute inset-0 w-full h-full pointer-events-none select-none ${className}`
      }
    />
  );
}
