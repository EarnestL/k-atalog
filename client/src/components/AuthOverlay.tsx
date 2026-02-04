import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import styles from './AuthOverlay.module.css'

interface AuthOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthOverlay({ isOpen, onClose }: AuthOverlayProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleNav = (to: string) => {
    onClose()
    navigate(to)
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Account options"
      >
        <h2 className={styles.title}>Account</h2>
        <p className={styles.subtitle}>Log in or create an account to unlock features</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => handleNav('/login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => handleNav('/register')}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
