import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  intensity?: number;
  mode?: 'fill' | 'masonry';
  loading?: 'eager' | 'lazy';
  onError?: () => void;
}

export function ParallaxImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  wrapperClassName = 'w-full h-full',
  intensity = 18,
  mode = 'fill',
  loading,
  onError,
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const rawY = useTransform(scrollYProgress, [0, 1], [-intensity, intensity]);
  const smoothY = useSpring(rawY, {
    stiffness: 170,
    damping: 28,
    mass: 0.45,
  });

  if (mode === 'masonry') {
    const safeScale = 1 + Math.max(0.08, intensity / 140);
    return (
      <div ref={containerRef} className={`relative overflow-hidden ${wrapperClassName}`}>
        <motion.div
          style={
            shouldReduceMotion
              ? undefined
              : {
                  y: smoothY,
                  scale: safeScale,
                }
          }
          className="w-full will-change-transform"
        >
          <img
            src={src}
            alt={alt}
            loading={loading}
            referrerPolicy="no-referrer"
            onError={onError}
            className={className}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${wrapperClassName}`}>
      <motion.div
        style={
          shouldReduceMotion
            ? { top: 0, height: '100%' }
            : {
                y: smoothY,
                top: -intensity,
                height: `calc(100% + ${intensity * 2}px)`,
              }
        }
        className="absolute inset-x-0 will-change-transform"
      >
        <img
          src={src}
          alt={alt}
          loading={loading}
          referrerPolicy="no-referrer"
          onError={onError}
          className={className}
        />
      </motion.div>
    </div>
  );
}
