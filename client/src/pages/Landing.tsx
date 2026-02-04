import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProfileOverlay from '../components/ProfileOverlay'
import SearchBar from '../components/SearchBar'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'
import styles from './Landing.module.css'

function ProfileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default function Landing() {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [profileOverlayOpen, setProfileOverlayOpen] = useState(false)

  return (
    <div className={styles.landing}>
      {/* Top right: Log out (when logged in) + Theme Toggle */}
      <div className={styles.topRight}>
        <button 
          className={styles.themeToggle} 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        )}
        </button>
        {user && (
          <button
            type="button"
            className={styles.profileBtn}
            onClick={() => setProfileOverlayOpen(true)}
            aria-label="Profile"
          >
            <ProfileIcon />
          </button>
        )}
      </div>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            <span className={styles.logoIcon}>K</span>
            <span className={styles.titleText}>-atalog</span>
          </h1>
          <p className={styles.subtitle}>
            Your complete K-pop photocard database
          </p>
          
          <div className={styles.searchWrapper}>
            <SearchBar variant="landing" autoFocus />
          </div>

          {!user && (
            <p className={styles.authPrompt}>
              <Link to="/login" className={styles.authLink}>Log in</Link>
              {' or '}
              <Link to="/register" className={styles.authLink}>Sign up</Link>
              {' to unlock features'}
            </p>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className={styles.decorCircle1} />
        <div className={styles.decorCircle2} />
        <div className={styles.decorCircle3} />
      </section>
      {user && (
        <ProfileOverlay
          isOpen={profileOverlayOpen}
          onClose={() => setProfileOverlayOpen(false)}
          email={user.email ?? ''}
          onLogout={signOut}
        />
      )}
    </div>
  )
}
