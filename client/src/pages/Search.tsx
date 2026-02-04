import { useSearchParams, Navigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import Header from '../components/Header'
import GroupCard from '../components/GroupCard'
import PhotocardCard from '../components/PhotocardCard'
import { api, type SearchResult } from '../api/client'
import styles from './Search.module.css'

type Tab = 'all' | 'groups' | 'photocards'

const emptyResults: SearchResult = {
  groups: [],
  members: [],
  photocards: [],
  totalPhotocards: 0,
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [results, setResults] = useState<SearchResult>(emptyResults)
  const [loading, setLoading] = useState(false)
  const [loadMoreLoading, setLoadMoreLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasMorePhotocards =
    results.photocards.length < results.totalPhotocards

  const handleLoadMorePhotocards = () => {
    if (loadMoreLoading || !hasMorePhotocards) return
    setLoadMoreLoading(true)
    api
      .search(query, { pcLimit: 40, pcOffset: results.photocards.length })
      .then((data) => {
        setResults((prev) => ({
          ...prev,
          groups: data.groups,
          members: data.members,
          photocards: [...prev.photocards, ...data.photocards],
          totalPhotocards: data.totalPhotocards,
        }))
      })
      .catch(() => {})
      .finally(() => setLoadMoreLoading(false))
  }

  useEffect(() => {
    if (!query.trim()) {
      setResults(emptyResults)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    api.search(query, { pcLimit: 40, pcOffset: 0 })
      .then((data) => {
        if (!cancelled) setResults(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Search failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [query])

  // Redirect to home if no search query
  if (!query.trim()) {
    return <Navigate to="/" replace />
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: results.groups.length + results.totalPhotocards },
    { id: 'groups', label: 'Groups', count: results.groups.length },
    { id: 'photocards', label: 'Photocards', count: results.totalPhotocards },
  ]

  if (error) {
    return (
      <div className={styles.page}>
        <Header searchQuery={query} />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.empty}>
              <h3>Something went wrong</h3>
              <p>{error}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const showGroups = activeTab === 'all' || activeTab === 'groups'
  const showPhotocards = activeTab === 'all' || activeTab === 'photocards'

  const groupsScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateGroupsScrollState = () => {
    const el = groupsScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    const el = groupsScrollRef.current
    if (!el) return
    updateGroupsScrollState()
    const ro = new ResizeObserver(updateGroupsScrollState)
    ro.observe(el)
    el.addEventListener('scroll', updateGroupsScrollState)
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', updateGroupsScrollState)
    }
  }, [showGroups, results.groups.length])

  const scrollGroups = (direction: 'left' | 'right') => {
    const el = groupsScrollRef.current
    if (!el) return
    const step = el.clientWidth
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' })
  }

  return (
    <div className={styles.page}>
      <Header searchQuery={query} />
      
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.title}>
              Results for "{query}"
            </h1>
            <p className={styles.subtitle}>
              {loading ? 'Searching...' : `Found ${tabs[0].count} results`}
            </p>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span className={styles.tabCount}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Results */}
          <div className={styles.results}>
            {/* Groups Section */}
            {showGroups && results.groups.length > 0 && (
              <section className={styles.section}>
                {activeTab === 'all' && (
                  <h2 className={styles.sectionTitle}>Groups</h2>
                )}
                <div className={styles.groupsRowWrap}>
                  {canScrollLeft && (
                    <button
                      type="button"
                      className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`}
                      onClick={() => scrollGroups('left')}
                      aria-label="Scroll groups left"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                  )}
                  <div ref={groupsScrollRef} className={styles.groupsGrid}>
                    {results.groups.map(group => (
                      <GroupCard key={group.id} group={group} />
                    ))}
                  </div>
                  {canScrollRight && (
                    <button
                      type="button"
                      className={`${styles.scrollBtn} ${styles.scrollBtnRight}`}
                      onClick={() => scrollGroups('right')}
                      aria-label="Scroll groups right"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Photocards Section */}
            {showPhotocards && results.photocards.length > 0 && (
              <section className={styles.section}>
                {activeTab === 'all' && (
                  <h2 className={styles.sectionTitle}>Photocards</h2>
                )}
                <div className={styles.photocardsSection}>
                  <div className={styles.photocardsGrid}>
                    {results.photocards.map(pc => (
                      <PhotocardCard key={pc.id} photocard={pc} showMember />
                    ))}
                  </div>
                  {hasMorePhotocards && (
                    <div className={styles.photocardsLoadMoreWrap}>
                      <div className={styles.photocardsFade} aria-hidden />
                      <button
                        type="button"
                        className={styles.loadMoreBtn}
                        onClick={handleLoadMorePhotocards}
                        disabled={loadMoreLoading}
                      >
                        {loadMoreLoading ? 'Loading...' : 'Load more'}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Empty State */}
            {query && !loading && tabs[0].count === 0 && (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <h3>No results found</h3>
                <p>Try searching for a different group or photocard</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
