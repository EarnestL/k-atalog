import { useState, useRef, useEffect } from 'react'
import type { Photocard } from '../data/photocards'
import styles from './PhotocardModal.module.css'

interface PhotocardModalProps {
  photocard: Photocard
  onClose: () => void
}

export default function PhotocardModal({ photocard, onClose }: PhotocardModalProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const lastPosition = useRef({ x: 0, y: 0 })
  const wasDragging = useRef(false)
  
  const hasBackImage = !!photocard.backImageUrl

  // Handle mouse/touch drag for 3D rotation
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    wasDragging.current = false
    lastPosition.current = { x: clientX, y: clientY }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return

    const deltaX = clientX - lastPosition.current.x
    const deltaY = clientY - lastPosition.current.y

    // Mark that actual dragging occurred
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      wasDragging.current = true
    }

    setRotation(prev => {
      const newX = Math.max(-30, Math.min(30, prev.x - deltaY * 0.5))
      let newY = prev.y + deltaX * 0.5
      
      // If no back image, limit Y rotation to prevent seeing the back
      if (!hasBackImage) {
        newY = Math.max(-45, Math.min(45, newY))
      }
      
      return { x: newX, y: newY }
    })

    lastPosition.current = { x: clientX, y: clientY }
  }

  const handleEnd = () => {
    setIsDragging(false)
    // Snap back to straight position
    setRotation({ x: 0, y: 0 })
    // Reset wasDragging after a short delay so intentional taps work
    setTimeout(() => {
      wasDragging.current = false
    }, 200)
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault() // Prevent scroll
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  // Flip card
  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    setRotation({ x: 0, y: 0 })
  }

  // Global mouse/touch events for dragging outside card bounds
  useEffect(() => {
    if (!isDragging) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleGlobalMouseUp = () => {
      handleEnd()
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault() // Prevent scroll
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }

    const handleGlobalTouchEnd = () => {
      handleEnd()
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    window.addEventListener('touchend', handleGlobalTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      window.removeEventListener('touchmove', handleGlobalTouchMove)
      window.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [isDragging])

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Close on backdrop/overlay click (only if not dragging)
  const handleClose = () => {
    // Don't close if user was just dragging the card
    if (wasDragging.current) {
      return
    }
    onClose()
  }

  const cardStyle = {
    transform: `
      perspective(1000px)
      rotateX(${rotation.x}deg)
      rotateY(${rotation.y + (isFlipped ? 180 : 0)}deg)
    `
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      {/* 3D Card Container - stop propagation so clicking card doesn't close */}
      <div className={styles.cardContainer} onClick={e => e.stopPropagation()}>
        <div
          ref={cardRef}
          className={`${styles.card3d} ${isDragging ? styles.dragging : ''}`}
          style={cardStyle}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Front of card */}
          <div className={styles.cardFace}>
            <img 
              src={photocard.imageUrl} 
              alt={photocard.name}
              className={styles.cardImage}
              draggable={false}
            />
          </div>
          
          {/* Back of card */}
          <div className={`${styles.cardFace} ${styles.cardBack}`}>
            {photocard.backImageUrl ? (
              <img 
                src={photocard.backImageUrl} 
                alt="Card back"
                className={styles.cardImage}
                draggable={false}
              />
            ) : (
              <div className={styles.backContent}>
                <div className={styles.backPattern} />
                <div className={styles.backInfo}>
                  <span className={styles.backLogo}>K</span>
                  <p>{photocard.groupName}</p>
                  <p>{photocard.memberName}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Info - clicking closes modal */}
      <div className={styles.info}>
        <h2 className={styles.memberName}>{photocard.memberName}</h2>
        <p className={styles.albumName}>{photocard.album}</p>
        <p className={styles.version}>{photocard.version} · {photocard.year}</p>
      </div>

      {/* Controls - only show flip button if back image exists */}
      {hasBackImage && (
        <div className={styles.controls} onClick={e => e.stopPropagation()}>
          <button className={styles.controlBtn} onClick={handleFlip}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v18M3 12l3-3-3-3M21 12l-3-3 3-3" />
            </svg>
            Flip
          </button>
        </div>
      )}

      <p className={styles.hint}>Tap anywhere to close</p>
    </div>
  )
}
