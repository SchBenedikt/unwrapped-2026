"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { formatNumber } from "@/lib/format";

type CounterProps = {
  value: number;
  delay?: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
};

export function Counter({
  value,
  delay = 0.15,
  duration = 1.5,
  format = formatNumber,
  className,
}: CounterProps) {
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (latest) => format(latest));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [value, duration, delay, motionValue]);

  return <motion.span className={className}>{text}</motion.span>;
}
