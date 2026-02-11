import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAddPhotocard } from '../contexts/AddPhotocardContext'
import styles from './ProfileOverlay.module.css'

interface ProfileOverlayProps {
  isOpen: boolean
  onClose: () => void
  email: string
  onLogout: () => void
}

export default function ProfileOverlay({ isOpen, onClose, email, onLogout }: ProfileOverlayProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { open: openAddPhotocard } = useAddPhotocard()

  const isOnSubmissions = location.pathname === '/submissions'

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

  const handleMySubmissions = () => {
    onClose()
    navigate('/submissions')
  }

  const handleAddPhotocard = () => {
    onClose()
    openAddPhotocard()
  }

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
          className={`${styles.addPhotocardBtn} ${isOnSubmissions ? styles.active : ''}`}
          onClick={handleMySubmissions}
          disabled={isOnSubmissions}
        >
          My submissions
        </button>
        <button
          type="button"
          className={styles.addPhotocardBtn}
          onClick={handleAddPhotocard}
        >
          Add photocard
        </button>
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
        >
          LOG OUT
        </button>
      </div>
    </div>,
    document.body
  )
}
