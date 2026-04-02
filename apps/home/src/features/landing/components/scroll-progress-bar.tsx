import { motion, useScroll, useSpring } from 'motion/react';

/**
 * Thin fixed progress bar at the top of the viewport.
 * Blue-to-green gradient, scales on X based on scroll progress.
 */
export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="gradient-line fixed top-0 right-0 left-0 z-50 h-[3px] origin-left"
      style={{ scaleX }}
    />
  );
}
