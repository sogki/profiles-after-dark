import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TouchOptimizedProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onLongPress?: () => void
  longPressDelay?: number
  swipeThreshold?: number
  className?: string
}

export default function MobileTouchOptimized({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onLongPress,
  longPressDelay = 500,
  swipeThreshold = 50,
  className = "",
}: TouchOptimizedProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const startPos = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
    setTouchStart(startPos)
    setTouchEnd(null)

    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true)
        onLongPress()
      }, longPressDelay)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    })

    // Cancel long press if user moves finger
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (!touchStart || !touchEnd) return

    const deltaX = touchEnd.x - touchStart.x
    const deltaY = touchEnd.y - touchStart.y
    const deltaTime = touchEnd.time - touchStart.time

    // Check if it's a swipe (fast movement) or tap (slow movement)
    const isSwipe = Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold
    const isTap = !isSwipe && deltaTime < 300 && !isLongPressing

    if (isTap && onTap) {
      onTap()
    } else if (isSwipe) {
      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
        }
      }
    }

    // Reset states
    setTouchStart(null)
    setTouchEnd(null)
    setIsLongPressing(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // For desktop testing
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true)
        onLongPress()
      }, longPressDelay)
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (onTap && !isLongPressing) {
      onTap()
    }

    setIsLongPressing(false)
  }

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsLongPressing(false)
  }

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  return (
    <motion.div
      className={`touch-manipulation select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.98 }}
      animate={isLongPressing ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

// Hook for mobile-specific interactions
export function useMobileInteractions() {
  const [isMobile, setIsMobile] = useState(false)
  const [touchSupported, setTouchSupported] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
      
      setIsMobile(isMobileDevice)
      setTouchSupported(hasTouch)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return { isMobile, touchSupported }
}
