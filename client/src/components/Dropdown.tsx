import { useState, useRef, useEffect } from 'react'
import styles from './Dropdown.module.css'

interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  label: string
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  /** When false, the label is not rendered (e.g. for sticky pill) */
  showLabel?: boolean
  /** Compact styling for use inside sticky pill */
  variant?: 'default' | 'pill'
}

export default function Dropdown({ label, options, value, onChange, showLabel = true, variant = 'default' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const optionTextRefs = useRef<(HTMLSpanElement | null)[]>([])
  const measureRafRef = useRef<number[]>([])
  const measureTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const runOverflowMeasurement = () => {
    const refs = optionTextRefs.current
    const wraps = refs
      .map((el) => el?.parentElement)
      .filter((w): w is HTMLElement => w != null && w.isConnected)
    if (wraps.length === 0) return
    wraps.forEach((w) => w.classList.add(styles.optionTextMeasuring))
    // Force reflow so both copies are laid out before we read scrollWidth (per-wrap on mobile)
    wraps.forEach((w) => void w.offsetHeight)
    // Use actual computed gap (2em = different px on mobile vs desktop) so overflow is correct
    const firstEl = refs.find((el) => el?.isConnected)
    const gapPx = firstEl
      ? parseFloat(getComputedStyle(firstEl).gap) || 24
      : 24
    refs.forEach((el) => {
      if (!el) return
      const wrap = el.parentElement
      if (!wrap?.isConnected) return
      const gap = parseFloat(getComputedStyle(el).gap) || gapPx
      const singleCopyWidth = (el.scrollWidth - gap) / 2
      const overflow = singleCopyWidth > wrap.clientWidth
      wrap.classList.toggle(styles.optionTextScroll, overflow)
    })
    wraps.forEach((w) => w.classList.remove(styles.optionTextMeasuring))
  }

  useEffect(() => {
    if (!isOpen) return
    const menuEl = menuRef.current
    const ro =
      typeof ResizeObserver !== 'undefined' && menuEl
        ? new ResizeObserver(() => runOverflowMeasurement())
        : null
    if (ro && menuEl) ro.observe(menuEl)
    // Double rAF so layout is complete (helps on desktop); then measure
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        runOverflowMeasurement()
        // Early delayed re-measure (menu open animation ~150ms)
        const t1 = setTimeout(() => runOverflowMeasurement(), 180)
        // Late delayed re-measure for slow mobile layout / paint
        const t2 = setTimeout(() => runOverflowMeasurement(), 400)
        measureTimeoutRef.current = [t1, t2]
      })
      measureRafRef.current = [raf1, raf2]
    })
    measureRafRef.current = [raf1]
    return () => {
      ro?.disconnect()
      measureRafRef.current.forEach((id) => cancelAnimationFrame(id))
      measureRafRef.current = []
      measureTimeoutRef.current.forEach((id) => clearTimeout(id))
      measureTimeoutRef.current = []
    }
  }, [isOpen, options])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={`${styles.wrapper} ${variant === 'pill' ? styles.pill : ''}`} ref={dropdownRef}>
      {showLabel && <span className={styles.label}>{label}</span>}
      <button
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className={styles.selectedText}>{selectedOption?.label}</span>
        <svg
          className={styles.arrow}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.menu} ref={menuRef}>
          {options.map((option, index) => (
            <button
              key={option.value}
              className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
              onClick={() => handleSelect(option.value)}
              type="button"
            >
              <span className={styles.optionTextWrap}>
                <span
                  className={styles.optionTextInner}
                  ref={r => { optionTextRefs.current[index] = r }}
                >
                  <span className={styles.optionTextCopy}>{option.label}</span>
                  <span className={styles.optionTextScrollSpacer} aria-hidden />
                  <span className={styles.optionTextCopy} aria-hidden>{option.label}</span>
                  <span className={styles.optionTextScrollSpacer} aria-hidden />
                </span>
              </span>
              {option.value === value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
