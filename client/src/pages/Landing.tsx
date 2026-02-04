import { useEffect } from 'react'
import SearchBar from '../components/SearchBar'
import { useTheme } from '../hooks/useTheme'
import styles from './Landing.module.css'

export default function Landing() {
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className={styles.landing}>
      {/* Theme Toggle */}
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
        </div>
        
        {/* Decorative elements */}
        <div className={styles.decorCircle1} />
        <div className={styles.decorCircle2} />
        <div className={styles.decorCircle3} />
      </section>
    </div>
  )
}
