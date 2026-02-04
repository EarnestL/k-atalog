import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './ProfileOverlay.module.css'

interface ProfileOverlayProps {
  isOpen: boolean
  onClose: () => void
  email: string
  onLogout: () => void
}

export default function ProfileOverlay({ isOpen, onClose, email, onLogout }: ProfileOverlayProps) {
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

  const handleLogout = () => {
    onLogout()
    onClose()
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
        aria-label="Profile menu"
      >
        <h2 className={styles.title}>Profile</h2>
        <div className={styles.email}>{email}</div>
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
    </div>,
    document.body
  )
}
