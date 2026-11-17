import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../context/AppContext.tsx';
import { BrandLogo } from './Logo.tsx';

export function InitialLoadingScreen() {
  const { initialLoading } = useApp();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {initialLoading && (
        <motion.div
          key="event-pro-initial-loader"
          role="status"
          aria-live="polite"
          aria-label="Chargement d'EVENT PRO"
          initial={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[80] bg-[#0A0A0A] flex items-center justify-center px-6 select-none"
        >
          {/* Subtle Ambient Gold Radial Depth */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,164,92,0.10)_0%,rgba(10,10,10,0)_60%)] pointer-events-none"
          />

          {/* Centered Emblem & 10-Second Progressive Gold Circle */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg
              viewBox="0 0 240 240"
              className="absolute inset-0 w-full h-full -rotate-90"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="eventProGoldCircle" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A8843E" />
                  <stop offset="50%" stopColor="#C9A45C" />
                  <stop offset="100%" stopColor="#E9CC88" />
                </linearGradient>
              </defs>

              {/* Subtle Reference Track */}
              <circle
                cx="120"
                cy="120"
                r="108"
                fill="none"
                stroke="#C9A45C"
                strokeOpacity="0.16"
                strokeWidth="1.25"
              />

              {/* Progressive Drawing Gold Circle (0 -> 100% over ~10 seconds) */}
              <motion.circle
                cx="120"
                cy="120"
                r="108"
                fill="none"
                stroke="url(#eventProGoldCircle)"
                strokeWidth="2.25"
                strokeLinecap="round"
                initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 9.8,
                        ease: [0.32, 0.08, 0.24, 1],
                      }
                }
              />
            </svg>

            {/* Centered Brand Identity */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex flex-col items-center text-center gap-2.5 px-4"
            >
              <BrandLogo dark />
              <span className="text-[10px] font-medium tracking-[0.28em] uppercase text-[#C9A45C]/85">
                Casablanca
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
