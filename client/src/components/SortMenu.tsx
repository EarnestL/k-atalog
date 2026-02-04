import { useState, useRef, useEffect, useLayoutEffect, type MouseEvent } from 'react'
import styles from './SortMenu.module.css'

export type SortOption = 'year-asc' | 'year-desc' | 'album-asc' | 'album-desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'year-asc', label: 'Year ↑' },
  { value: 'year-desc', label: 'Year ↓' },
  { value: 'album-asc', label: 'Album ↑' },
  { value: 'album-desc', label: 'Album ↓' },
]

interface SortMenuProps {
  value: SortOption | null
  onChange: (value: SortOption | null) => void
}

export default function SortMenu({ value, onChange }: SortMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const prevWidthRef = useRef<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [useHover, setUseHover] = useState(true)
  const [animWidth, setAnimWidth] = useState<number | null>(null)

  const hasSelection = value !== null
  const selectedLabel = hasSelection
    ? SORT_OPTIONS.find((opt) => opt.value === value)?.label ?? 'Sort'
    : ''

  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const w = el.scrollWidth
    if (prevWidthRef.current === null) {
      prevWidthRef.current = w
      setAnimWidth(w)
      return
    }
    const fromW = prevWidthRef.current
    setAnimWidth(fromW)
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimWidth(w)
        prevWidthRef.current = w
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [hasSelection, value, selectedLabel])

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)')
    setUseHover(mq.matches)
    const fn = () => setUseHover(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleScroll = () => setIsOpen(false)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOpen])

  const handlePanelMouseEnter = () => {
    if (useHover) setIsOpen(true)
  }

  const handleRootMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (!useHover) return
    const nextTarget = e.relatedTarget as Node | null
    if (nextTarget && rootRef.current?.contains(nextTarget)) return
    setIsOpen(false)
  }

  const handleTriggerClick = () => {
    if (!useHover) setIsOpen((o) => !o)
  }

  const handleSelect = (optionValue: SortOption) => {
    if (optionValue === value) {
      onChange(null)
    } else {
      onChange(optionValue)
    }
    setIsOpen(false)
  }

  return (
    <div
      className={styles.root}
      ref={rootRef}
      onMouseLeave={handleRootMouseLeave}
      aria-label="Sort photocards"
    >
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ''} ${hasSelection ? styles.triggerTextActive : styles.triggerIcon}`}
        onClick={handleTriggerClick}
        onMouseEnter={handlePanelMouseEnter}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div
          className={styles.triggerAnimWrapper}
          style={animWidth !== null ? { width: animWidth } : undefined}
        >
          <div ref={contentRef} className={styles.triggerContent}>
            {hasSelection ? (
              <span className={styles.triggerText}>{selectedLabel}</span>
            ) : (
              <SortIcon className={styles.sortIcon} />
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div
          className={styles.panel}
          role="listbox"
          onMouseEnter={handlePanelMouseEnter}
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              className={`${styles.option} ${opt.value === value ? styles.optionSelected : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
              {opt.value === value && <CheckIcon className={styles.checkIcon} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SortIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 16 4 4 4-4" />
      <path d="M7 20V4" />
      <path d="m21 8-4-4-4 4" />
      <path d="M17 4v16" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
