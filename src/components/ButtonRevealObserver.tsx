import { useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';

const BUTTON_SELECTOR = [
  'button:not([data-motion-button]):is([class*="rounded-lg"], [class*="rounded-xl"], [class*="rounded-full"], [class*="rounded-md"], [type="submit"])',
  'a:is([class*="rounded-lg"], [class*="rounded-xl"], [class*="rounded-full"]):is([class*="bg-"], [class*="border"])',
].join(', ');

export function ButtonRevealObserver() {
  const { initialLoading, currentPage } = useApp();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || initialLoading) return;

    const observed = new WeakSet<Element>();
    let batchCounter = 0;
    let batchResetTimer: number | null = null;

    const nextStaggerDelay = () => {
      const delayMs = (batchCounter % 5) * 45;
      batchCounter += 1;
      if (batchResetTimer !== null) window.clearTimeout(batchResetTimer);
      batchResetTimer = window.setTimeout(() => {
        batchCounter = 0;
      }, 120);
      return `${delayMs}ms`;
    };

    const revealElement = (el: HTMLElement) => {
      if (el.dataset.btnState === 'revealed') return;
      el.dataset.btnState = 'revealed';
      el.style.setProperty('--btn-reveal-delay', nextStaggerDelay());
      el.classList.add('btn-fade-slide-in');
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            revealElement(entry.target as HTMLElement);
            io.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -12px 0px',
      }
    );

    const processElements = (root: ParentNode = document) => {
      const candidates = root.querySelectorAll<HTMLElement>(BUTTON_SELECTOR);
      candidates.forEach((el) => {
        if (observed.has(el) || el.dataset.btnState === 'revealed') return;
        observed.add(el);

        const isFixedOrOverlay = Boolean(el.closest('header, nav, [role="dialog"], .fixed'));
        const rect = el.getBoundingClientRect();
        const inOrAboveViewport = rect.top <= window.innerHeight + 16;

        if (isFixedOrOverlay || inOrAboveViewport) {
          revealElement(el);
        } else {
          el.dataset.btnState = 'pending';
          io.observe(el);
        }
      });
    };

    processElements(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches(BUTTON_SELECTOR)) {
            if (!observed.has(node) && node.dataset.btnState !== 'revealed') {
              observed.add(node);
              const rect = node.getBoundingClientRect();
              if (
                node.closest('header, nav, [role="dialog"], .fixed') ||
                rect.top <= window.innerHeight + 16
              ) {
                revealElement(node);
              } else {
                node.dataset.btnState = 'pending';
                io.observe(node);
              }
            }
          }
          processElements(node);
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      if (batchResetTimer !== null) window.clearTimeout(batchResetTimer);
    };
  }, [initialLoading, currentPage]);

  return null;
}
