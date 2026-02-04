import { useState, useEffect, RefObject } from 'react'
import styles from './PageIndicator.module.css'

interface PageIndicatorProps {
  title: string
  subtitle?: string
  imageUrl?: string
  /** When provided (e.g. Group page), use this element's scroll instead of window */
  scrollContainerRef?: RefObject<HTMLElement | null>
}

export default function PageIndicator({ title, subtitle, imageUrl, scrollContainerRef }: PageIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = scrollContainerRef?.current
    const handleScroll = () => {
      const scrollTop = el ? el.scrollTop : window.scrollY
      setIsVisible(scrollTop > 200)
    }

    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll()
      return () => el.removeEventListener('scroll', handleScroll)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollContainerRef])

  const handleClick = () => {
    const el = scrollContainerRef?.current
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`${styles.indicator} ${isVisible ? styles.visible : ''}`}>
      <button className={styles.container} onClick={handleClick}>
        {imageUrl && (
          <img src={imageUrl} alt={title} className={styles.image} />
        )}
        <div className={styles.text}>
          <span className={styles.title}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </div>
  )
}
