import type { LucideIcon } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';

interface FeatureCard3DProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
  iconBgColor: string;
}

/**
 * Glassmorphism feature card with mouse-reactive 3D tilt.
 * Uses Framer Motion springs for smooth rotateX/rotateY.
 */
export default function FeatureCard3D({
  icon: Icon,
  title,
  description,
  iconColor,
  iconBgColor,
}: FeatureCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 300,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 300,
    damping: 20,
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="glassmorphism cursor-default p-6 transition-shadow duration-300 will-change-transform hover:shadow-2xl md:p-8"
    >
      <div
        className={`mb-4 inline-flex size-12 items-center justify-center rounded-xl ${iconBgColor}`}
      >
        <Icon className={`size-6 ${iconColor}`} />
      </div>
      <h3 className="mb-2 font-bold font-display text-foreground text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
