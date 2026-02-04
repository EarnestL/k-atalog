import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthOverlay from './AuthOverlay'
import ProfileOverlay from './ProfileOverlay'
import SearchBar from './SearchBar'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'
import styles from './Header.module.css'

interface HeaderProps {
  showSearch?: boolean
  searchQuery?: string
}

function ProfileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default function Header({ showSearch = true, searchQuery = '' }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [authOverlayOpen, setAuthOverlayOpen] = useState(false)
  const [profileOverlayOpen, setProfileOverlayOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>K</span>
            <span className={styles.logoText}>atalog</span>
          </Link>
        </div>
        
        {showSearch && (
          <div className={styles.searchWrapper}>
            <SearchBar variant="header" initialValue={searchQuery} />
          </div>
        )}
        
        <div className={styles.right}>
          <nav className={styles.nav}>
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
            {!user ? (
              <>
                <div className={styles.navLinksDesktop}>
                  <Link to="/login" className={styles.navLink}>Log in</Link>
                  <Link to="/register" className={styles.navLink}>Sign up</Link>
                </div>
                <button
                  type="button"
                  className={styles.navAuthMobile}
                  onClick={() => setAuthOverlayOpen(true)}
                  aria-label="Account"
                >
                  <ProfileIcon />
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.profileTrigger}
                onClick={() => setProfileOverlayOpen(true)}
                aria-label="Profile menu"
              >
                <ProfileIcon />
              </button>
            )}
          </nav>
        </div>
      </div>
      <AuthOverlay
        isOpen={authOverlayOpen}
        onClose={() => setAuthOverlayOpen(false)}
      />
      {user && (
        <ProfileOverlay
          isOpen={profileOverlayOpen}
          onClose={() => setProfileOverlayOpen(false)}
          email={user.email ?? ''}
          onLogout={signOut}
        />
      )}
    </header>
  )
}
