import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../context/AppContext.tsx';

interface TextRevealTitleProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3';
  surface?: 'light' | 'dark';
  className?: string;
  immediate?: boolean;
}

export function TextRevealTitle({
  text,
  as = 'h2',
  surface = 'light',
  className = '',
  immediate = false,
}: TextRevealTitleProps) {
  const { initialLoading } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLHeadingElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setRevealed(true);
      return;
    }
    if (initialLoading || revealed) return;

    if (immediate) {
      const timer = window.setTimeout(() => setRevealed(true), 60);
      return () => window.clearTimeout(timer);
    }

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [initialLoading, immediate, revealed, shouldReduceMotion]);

  const words = text.trim().split(/\s+/);
  const isDark = surface === 'dark';

  const gradientStyle = {
    backgroundImage: isDark
      ? 'linear-gradient(115deg, #FFFFFF 0%, #FFFFFF 28%, #F4DFB0 58%, #C9A45C 84%, #E8CA82 100%)'
      : 'linear-gradient(115deg, #151515 0%, #151515 28%, #6B5020 58%, #A8843E 82%, #C9A45C 100%)',
    backgroundSize: '210% 100%',
  };

  const Tag = as;

  return (
    <Tag ref={containerRef} aria-label={text} className={className}>
      <span aria-hidden="true" className="inline">
        {words.map((word, index) => (
          <span
            key={`${index}-${word}`}
            className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em] mr-[0.26em] last:mr-0"
          >
            <motion.span
              className="inline-block bg-clip-text text-transparent will-change-transform"
              style={gradientStyle}
              initial={
                shouldReduceMotion
                  ? { y: '0%', opacity: 1, backgroundPosition: '22% 50%' }
                  : { y: '105%', opacity: 0, backgroundPosition: '100% 50%' }
              }
              animate={
                revealed || shouldReduceMotion
                  ? { y: '0%', opacity: 1, backgroundPosition: '22% 50%' }
                  : { y: '105%', opacity: 0, backgroundPosition: '100% 50%' }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.62,
                      delay: Math.min(index * 0.048, 0.45),
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
