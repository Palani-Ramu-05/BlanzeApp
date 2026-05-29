import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  suffix?: string
  decimals?: number
}

export function AnimatedCounter({ value, suffix = '', decimals = 0 }: AnimatedCounterProps) {
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { stiffness: 90, damping: 20 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    motionValue.set(value)
  }, [motionValue, value])

  useEffect(() => {
    return springValue.on('change', (latest) => setDisplay(latest))
  }, [springValue])

  return (
    <motion.span>
      {display.toFixed(decimals)}
      {suffix}
    </motion.span>
  )
}
