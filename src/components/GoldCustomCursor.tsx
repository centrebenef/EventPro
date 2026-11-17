import { useEffect, useRef, useState } from 'react';

type CursorMode = 'default' | 'interactive' | 'image' | 'text';

const DESKTOP_MOUSE_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 768px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function detectTargetMode(target: EventTarget | null): CursorMode {
  if (!(target instanceof Element)) return 'default';

  if (target.closest('input, textarea, select, [contenteditable="true"]')) {
    return 'text';
  }

  if (
    target.tagName === 'IMG' ||
    target.closest('[data-cursor="image"], figure, picture')
  ) {
    return 'image';
  }

  if (
    target.closest(
      'button:not(:disabled), a[href], [role="button"], summary, label[for], [data-cursor="interactive"]'
    )
  ) {
    return 'interactive';
  }

  const aspectFrame = target.closest('[class*="aspect-"]');
  if (aspectFrame && aspectFrame.querySelector('img')) {
    return 'image';
  }

  return 'default';
}

export function GoldCustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [pressed, setPressed] = useState(false);

  const ringRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);

  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const modeRef = useRef<CursorMode>('default');
  const reducedMotionRef = useRef(false);

  // Track device capabilities (desktop mouse only; disable on mobile/touch)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const desktopMq = window.matchMedia(DESKTOP_MOUSE_QUERY);
    const motionMq = window.matchMedia(REDUCED_MOTION_QUERY);

    const syncCapabilities = () => {
      setEnabled(desktopMq.matches);
      setReducedMotion(motionMq.matches);
      reducedMotionRef.current = motionMq.matches;
      if (!desktopMq.matches) {
        setVisible(false);
        visibleRef.current = false;
      }
    };

    syncCapabilities();
    desktopMq.addEventListener('change', syncCapabilities);
    motionMq.addEventListener('change', syncCapabilities);

    return () => {
      desktopMq.removeEventListener('change', syncCapabilities);
      motionMq.removeEventListener('change', syncCapabilities);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const applyTransforms = (x: number, y: number) => {
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      if (accentRef.current) {
        accentRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const tick = () => {
      const ease = reducedMotionRef.current ? 1 : 0.22;
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;

      currentPos.current.x += dx * ease;
      currentPos.current.y += dy * ease;

      applyTransforms(currentPos.current.x, currentPos.current.y);

      if (Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15) {
        rafId.current = window.requestAnimationFrame(tick);
      } else {
        currentPos.current.x = targetPos.current.x;
        currentPos.current.y = targetPos.current.y;
        applyTransforms(currentPos.current.x, currentPos.current.y);
        rafId.current = null;
      }
    };

    const ensureLoop = () => {
      if (rafId.current === null) {
        rafId.current = window.requestAnimationFrame(tick);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Immediately suppress for touch or stylus events on hybrid devices
      if (e.pointerType !== 'mouse') {
        if (visibleRef.current) {
          visibleRef.current = false;
          setVisible(false);
        }
        return;
      }

      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;

      if (!visibleRef.current) {
        currentPos.current.x = e.clientX;
        currentPos.current.y = e.clientY;
        applyTransforms(e.clientX, e.clientY);
        visibleRef.current = true;
        setVisible(true);
      }

      const nextMode = detectTargetMode(e.target);
      if (nextMode !== modeRef.current) {
        modeRef.current = nextMode;
        setMode(nextMode);
      }

      ensureLoop();
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') setPressed(true);
    };

    const handlePointerUp = () => {
      setPressed(false);
    };

    const handlePointerLeaveWindow = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        visibleRef.current = false;
        setVisible(false);
        setPressed(false);
      }
    };

    const handleTouchStart = () => {
      visibleRef.current = false;
      setVisible(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('mouseout', handlePointerLeaveWindow);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseout', handlePointerLeaveWindow);
      window.removeEventListener('touchstart', handleTouchStart);
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  const isExpanded = mode === 'interactive' || mode === 'image';
  const baseScale =
    mode === 'image' ? 2.05 : mode === 'interactive' ? 1.6 : mode === 'text' ? 0.72 : 1;
  const finalScale = pressed ? baseScale * 0.86 : baseScale;
  const ringOpacity = !visible ? 0 : mode === 'text' ? 0.25 : 1;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[70] pointer-events-none select-none overflow-hidden"
    >
      {/* Primary Luxury Gold Halo Ring (keeps native OS cursor intact for accessibility) */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 will-change-transform"
        style={{
          opacity: ringOpacity,
          transition: reducedMotion ? 'none' : 'opacity 180ms ease-out',
        }}
      >
        <div
          className="rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '32px',
            height: '32px',
            transform: `scale(${finalScale})`,
            border:
              mode === 'image'
                ? '1.5px solid rgba(201, 164, 92, 0.95)'
                : mode === 'interactive'
                ? '1.5px solid rgba(201, 164, 92, 0.9)'
                : '1.25px solid rgba(201, 164, 92, 0.72)',
            backgroundColor:
              mode === 'image'
                ? 'rgba(201, 164, 92, 0.10)'
                : mode === 'interactive'
                ? 'rgba(201, 164, 92, 0.08)'
                : 'rgba(201, 164, 92, 0.03)',
            boxShadow: isExpanded
              ? '0 0 22px rgba(201, 164, 92, 0.28), inset 0 0 12px rgba(201, 164, 92, 0.12)'
              : '0 0 12px rgba(201, 164, 92, 0.16)',
            transition: reducedMotion
              ? 'none'
              : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms ease, background-color 180ms ease, box-shadow 200ms ease',
          }}
        />
      </div>

      {/* Subtle Secondary Inner Champagne Ring on Image & Button Hover */}
      <div
        ref={accentRef}
        className="fixed top-0 left-0 will-change-transform"
        style={{
          opacity: visible && mode === 'image' ? 0.75 : 0,
          transition: reducedMotion ? 'none' : 'opacity 180ms ease-out',
        }}
      >
        <div
          className="rounded-full -translate-x-1/2 -translate-y-1/2 border border-[#F7F4EF]/70"
          style={{
            width: '48px',
            height: '48px',
            transform: pressed ? 'scale(0.9)' : 'scale(1)',
            transition: reducedMotion
              ? 'none'
              : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  );
}
