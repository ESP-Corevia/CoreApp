import { useScroll, useTransform, type MotionValue } from 'motion/react';
import { useRef } from 'react';

interface UseParallaxOptions {
  speed?: number;
  offset?: ['start end' | 'start start' | 'end start' | 'end end', 'start end' | 'start start' | 'end start' | 'end end'];
}

/**
 * Parallax hook — returns a ref to attach to a container and a
 * `y` MotionValue for offsetting child elements at different speeds.
 */
export function useParallax({ speed = 0.5, offset = ['start end', 'end start'] }: UseParallaxOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -50}px`, `${speed * 50}px`]);

  return { ref, y, scrollYProgress };
}
