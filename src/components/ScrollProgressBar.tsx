import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

export function ScrollProgressBar() {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 34,
    restDelta: 0.001,
  });

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[65] h-[2.5px] pointer-events-none bg-transparent"
    >
      <motion.div
        className="h-full w-full origin-left bg-gradient-to-r from-[#A8843E] via-[#C9A45C] to-[#E6C782] shadow-[0_0_8px_rgba(201,164,92,0.45)] will-change-transform"
        style={{ scaleX: shouldReduceMotion ? scrollYProgress : smoothProgress }}
      />
    </div>
  );
}
