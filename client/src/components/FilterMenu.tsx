import { useState, useRef, useEffect, useLayoutEffect, useCallback, type MouseEvent } from 'react'
import dropdownStyles from './Dropdown.module.css'
import styles from './FilterMenu.module.css'

export interface FilterOption {
  value: string
  label: string
}

interface FilterMenuProps {
  memberOptions: FilterOption[]
  albumOptions: FilterOption[]
  memberValue: string
  albumValue: string
  onMemberChange: (value: string) => void
  onAlbumChange: (value: string) => void
}

export default function FilterMenu({
  memberOptions,
  albumOptions,
  memberValue,
  albumValue,
  onMemberChange,
  onAlbumChange,
}: FilterMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mainPanelRef = useRef<HTMLDivElement>(null)
  const memberSubmenuRef = useRef<HTMLDivElement>(null)
  const albumSubmenuRef = useRef<HTMLDivElement>(null)
  const memberOptionRefs = useRef<(HTMLSpanElement | null)[]>([])
  const albumOptionRefs = useRef<(HTMLSpanElement | null)[]>([])
  const triggerRef = useRef<HTMLButtonElement>(null)
  const triggerTextWrapRef = useRef<HTMLSpanElement>(null)
  const triggerTextSingleRef = useRef<HTMLSpanElement>(null)
  const triggerTextInnerRef = useRef<HTMLSpanElement>(null)
  const triggerMeasureRafRef = useRef<number[]>([])
  const triggerMeasureTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const [isOpen, setIsOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<'member' | 'album' | null>(null)
  const [useHover, setUseHover] = useState(true)
  const [triggerNeedsScroll, setTriggerNeedsScroll] = useState(false)
  const triggerContentRef = useRef<HTMLDivElement>(null)
  const prevTriggerWidthRef = useRef<number | null>(null)
  const [animWidth, setAnimWidth] = useState<number | null>(null)
  const measureTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const measureRafRef = useRef<number[]>([])

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)')
    setUseHover(mq.matches)
    const fn = () => setUseHover(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const calculateOverflow = useCallback((wrap: HTMLElement, inner: HTMLSpanElement) => {
    const firstCopy = inner.firstElementChild as HTMLElement | null
    const singleCopyWidth = firstCopy
      ? Math.ceil(firstCopy.getBoundingClientRect().width)
      : Math.ceil(inner.scrollWidth / 2)
    const wrapWidth = Math.floor(wrap.clientWidth)
    return singleCopyWidth - wrapWidth > 1
  }, [])

  const runOverflowMeasurement = useCallback((refs: (HTMLSpanElement | null)[]) => {
    refs.forEach((el) => {
      if (!el) return
      const wrap = el.parentElement
      if (!wrap?.isConnected) return
      const overflow = calculateOverflow(wrap, el)
      wrap.classList.toggle(dropdownStyles.optionTextScroll, overflow)
    })
  }, [calculateOverflow])

  const runSubmenuMeasurements = useCallback(() => {
    if (openSubmenu === 'member') runOverflowMeasurement(memberOptionRefs.current)
    if (openSubmenu === 'album') runOverflowMeasurement(albumOptionRefs.current)
  }, [openSubmenu, runOverflowMeasurement])

  const memberActive = memberValue !== 'all'
  const albumActive = albumValue !== 'all'
  const memberLabel = memberOptions.find((opt) => opt.value === memberValue)?.label ?? ''
  const albumLabel = albumOptions.find((opt) => opt.value === albumValue)?.label ?? ''
  const triggerText = memberActive && albumActive
    ? `${memberLabel} | ${albumLabel}`
    : memberActive
      ? memberLabel
      : albumActive
        ? albumLabel
        : ''
  const hasActiveFilters = triggerText.length > 0

  const MAX_TEXT_WIDTH = 280
  const MAX_TEXT_WIDTH_MOBILE = 160
  const TEXT_WIDTH_BUFFER = 16
  const measureRef = useRef<HTMLSpanElement>(null)
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  )

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const effectiveMaxWidth = viewportWidth <= 480 ? MAX_TEXT_WIDTH_MOBILE : MAX_TEXT_WIDTH

  useLayoutEffect(() => {
    if (!hasActiveFilters) {
      const w = 44
      if (prevTriggerWidthRef.current === null) {
        prevTriggerWidthRef.current = w
        setAnimWidth(w)
        return
      }
      const fromW = prevTriggerWidthRef.current
      setAnimWidth(fromW)
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimWidth(w)
          prevTriggerWidthRef.current = w
        })
      })
      return () => cancelAnimationFrame(raf)
    }
    const measureEl = measureRef.current
    if (!measureEl) return
    const w = Math.min(effectiveMaxWidth, measureEl.offsetWidth + TEXT_WIDTH_BUFFER)
    if (prevTriggerWidthRef.current === null) {
      prevTriggerWidthRef.current = w
      setAnimWidth(w)
      return
    }
    const fromW = prevTriggerWidthRef.current
    setAnimWidth(fromW)
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimWidth(w)
        prevTriggerWidthRef.current = w
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [hasActiveFilters, memberValue, albumValue, triggerText, effectiveMaxWidth])

  const performTriggerMeasurement = useCallback(() => {
    const measureEl = measureRef.current
    if (!measureEl || !hasActiveFilters) {
      setTriggerNeedsScroll(false)
      return
    }
    // Only scroll if text overflows (or nearly overflows) at max block size
    const textWidth = measureEl.offsetWidth
    const scrollThreshold = viewportWidth <= 480 ? MAX_TEXT_WIDTH_MOBILE - 12 : MAX_TEXT_WIDTH - 12
    setTriggerNeedsScroll(textWidth > scrollThreshold)
  }, [hasActiveFilters, triggerText, viewportWidth])

  const scheduleTriggerMeasurement = useCallback(() => {
    triggerMeasureRafRef.current.forEach((id) => cancelAnimationFrame(id))
    triggerMeasureTimeoutRef.current.forEach((id) => clearTimeout(id))
    triggerMeasureRafRef.current = []
    triggerMeasureTimeoutRef.current = []
    if (!triggerTextWrapRef.current) return
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        performTriggerMeasurement()
        if (hasActiveFilters) {
          const t1 = setTimeout(performTriggerMeasurement, 180)
          const t2 = setTimeout(performTriggerMeasurement, 400)
          triggerMeasureTimeoutRef.current = [t1, t2]
        }
      })
      triggerMeasureRafRef.current = [raf1, raf2]
    })
    triggerMeasureRafRef.current = [raf1]
  }, [performTriggerMeasurement, hasActiveFilters])

  useEffect(() => {
    if (!hasActiveFilters) {
      setTriggerNeedsScroll(false)
      return
    }
    // Reset to single-copy first so measurement uses actual text width (not double-copy+spacers)
    setTriggerNeedsScroll(false)
    scheduleTriggerMeasurement()
    return () => {
      triggerMeasureRafRef.current.forEach((id) => cancelAnimationFrame(id))
      triggerMeasureTimeoutRef.current.forEach((id) => clearTimeout(id))
      triggerMeasureRafRef.current = []
      triggerMeasureTimeoutRef.current = []
    }
  }, [memberValue, albumValue, hasActiveFilters, scheduleTriggerMeasurement])

  useEffect(() => {
    if (!hasActiveFilters) return
    const btn = triggerRef.current
    if (!btn) return
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => scheduleTriggerMeasurement())
      : null
    if (ro) ro.observe(btn)
    window.addEventListener('resize', scheduleTriggerMeasurement)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', scheduleTriggerMeasurement)
    }
  }, [hasActiveFilters, scheduleTriggerMeasurement])

  useEffect(() => {
    if (!isOpen || !openSubmenu) return
    const submenuEl = openSubmenu === 'member' ? memberSubmenuRef.current : albumSubmenuRef.current
    const ro = typeof ResizeObserver !== 'undefined' && submenuEl
      ? new ResizeObserver(() => runSubmenuMeasurements())
      : null
    if (ro && submenuEl) ro.observe(submenuEl)
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        runSubmenuMeasurements()
        const t1 = setTimeout(runSubmenuMeasurements, 180)
        const t2 = setTimeout(runSubmenuMeasurements, 400)
        measureTimeoutsRef.current = [t1, t2]
      })
      measureRafRef.current = [raf1, raf2]
    })
    measureRafRef.current = [raf1]
    return () => {
      ro?.disconnect()
      measureRafRef.current.forEach((id) => cancelAnimationFrame(id))
      measureRafRef.current = []
      measureTimeoutsRef.current.forEach((id) => clearTimeout(id))
      measureTimeoutsRef.current = []
    }
  }, [isOpen, openSubmenu, runSubmenuMeasurements])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setOpenSubmenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleScroll = () => {
      setIsOpen(false)
      setOpenSubmenu(null)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOpen])

  const closeAll = () => {
    setIsOpen(false)
    setOpenSubmenu(null)
  }

  const handleTriggerClick = () => {
    if (useHover) return
    setIsOpen((o) => !o)
    if (isOpen) setOpenSubmenu(null)
  }

  const handleMainPanelMouseEnter = () => {
    if (useHover) setIsOpen(true)
  }

  const handleRootMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (!useHover) return
    const nextTarget = e.relatedTarget as Node | null
    if (nextTarget && rootRef.current?.contains(nextTarget)) return
    setIsOpen(false)
    setOpenSubmenu(null)
  }

  const handleMemberRowEnter = () => {
    if (useHover) setOpenSubmenu('member')
  }
  const handleMemberRowClick = () => {
    if (!useHover) setOpenSubmenu((s) => (s === 'member' ? null : 'member'))
  }

  const handleAlbumRowEnter = () => {
    if (useHover) setOpenSubmenu('album')
  }

  const handleResetRowEnter = () => {
    if (useHover) setOpenSubmenu(null)
  }
  const handleAlbumRowClick = () => {
    if (!useHover) setOpenSubmenu((s) => (s === 'album' ? null : 'album'))
  }

  const handleMemberSelect = (value: string) => {
    onMemberChange(value)
    if (!useHover) closeAll()
  }
  const handleAlbumSelect = (value: string) => {
    onAlbumChange(value)
    if (!useHover) closeAll()
  }

  const handleReset = () => {
    onMemberChange('all')
    onAlbumChange('all')
    closeAll()
  }

  return (
    <div
      className={styles.root}
      ref={rootRef}
      onMouseLeave={handleRootMouseLeave}
      aria-label="Filter by member and album"
    >
      {hasActiveFilters && (
        <span
          ref={measureRef}
          className={styles.measureText}
          aria-hidden
        >
          {triggerText}
        </span>
      )}
      <button
        type="button"
        ref={triggerRef}
        className={[
          styles.trigger,
          isOpen ? styles.open : '',
          hasActiveFilters ? styles.triggerTextActive : styles.triggerIcon,
        ].filter(Boolean).join(' ')}
        onClick={handleTriggerClick}
        onMouseEnter={handleMainPanelMouseEnter}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div
          className={styles.triggerAnimWrapper}
          style={animWidth !== null ? { width: animWidth } : undefined}
        >
          <div ref={triggerContentRef} className={styles.triggerContent}>
            {hasActiveFilters ? (
              <span className={styles.triggerText}>
                <span
                  className={`${dropdownStyles.optionTextWrap} ${triggerNeedsScroll ? dropdownStyles.optionTextScroll : ''}`}
                  ref={triggerTextWrapRef}
                >
                  {triggerNeedsScroll ? (
                    <span className={dropdownStyles.optionTextInner} ref={triggerTextInnerRef}>
                      <span className={dropdownStyles.optionTextCopy}>{triggerText}</span>
                      <span className={dropdownStyles.optionTextScrollSpacer} aria-hidden />
                      <span className={dropdownStyles.optionTextCopy} aria-hidden>{triggerText}</span>
                      <span className={dropdownStyles.optionTextScrollSpacer} aria-hidden />
                    </span>
                  ) : (
                    <span ref={triggerTextSingleRef} className={styles.triggerTextSingle}>{triggerText}</span>
                  )}
                </span>
              </span>
            ) : (
              <FilterIcon className={styles.filterIcon} />
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div
          className={styles.mainPanel}
          ref={mainPanelRef}
          onMouseEnter={handleMainPanelMouseEnter}
        >
          <div className={styles.mainColumn}>
            <div
              className={`${styles.row} ${openSubmenu === 'member' ? styles.rowActive : ''}`}
              onMouseEnter={handleMemberRowEnter}
              onClick={handleMemberRowClick}
            >
              <span className={styles.rowLabel}>Member</span>
              <span className={styles.chevron} aria-hidden>›</span>
              {openSubmenu === 'member' && (
                <>
                  <span className={styles.submenuBridge} aria-hidden />
                  <div className={styles.submenu} ref={memberSubmenuRef}>
                    {memberOptions.map((opt, i) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.option} ${opt.value === memberValue ? styles.optionSelected : ''}`}
                        onClick={() => handleMemberSelect(opt.value)}
                      >
                        <span className={dropdownStyles.optionTextWrap}>
                          <span
                            className={dropdownStyles.optionTextInner}
                            ref={(r) => { memberOptionRefs.current[i] = r }}
                          >
                            <span className={dropdownStyles.optionTextCopy}>{opt.label}</span>
                            <span className={dropdownStyles.optionTextCopy} aria-hidden>{opt.label}</span>
                          </span>
                        </span>
                        {opt.value === memberValue && <CheckIcon className={styles.checkIcon} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div
              className={`${styles.row} ${openSubmenu === 'album' ? styles.rowActive : ''}`}
              onMouseEnter={handleAlbumRowEnter}
              onClick={handleAlbumRowClick}
            >
              <span className={styles.rowLabel}>Album</span>
              <span className={styles.chevron} aria-hidden>›</span>
              {openSubmenu === 'album' && (
                <>
                  <span className={styles.submenuBridge} aria-hidden />
                  <div className={styles.submenu} ref={albumSubmenuRef}>
                    {albumOptions.map((opt, i) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.option} ${opt.value === albumValue ? styles.optionSelected : ''}`}
                        onClick={() => handleAlbumSelect(opt.value)}
                      >
                        <span className={dropdownStyles.optionTextWrap}>
                          <span
                            className={dropdownStyles.optionTextInner}
                            ref={(r) => { albumOptionRefs.current[i] = r }}
                          >
                            <span className={dropdownStyles.optionTextCopy}>{opt.label}</span>
                            <span className={dropdownStyles.optionTextCopy} aria-hidden>{opt.label}</span>
                          </span>
                        </span>
                        {opt.value === albumValue && <CheckIcon className={styles.checkIcon} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className={styles.resetRow} onMouseEnter={handleResetRowEnter}>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={handleReset}
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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
