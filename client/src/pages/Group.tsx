import { useParams, Link } from 'react-router-dom'
import { useState, useMemo, useRef, useEffect } from 'react'
import Header from '../components/Header'
import PageIndicator from '../components/PageIndicator'
import FilterMenu from '../components/FilterMenu'
import SortMenu, { type SortOption } from '../components/SortMenu'
import PhotocardCard from '../components/PhotocardCard'
import { api } from '../api/client'
import type { Photocard, Group } from '../data/photocards'
import styles from './Group.module.css'

const HEADER_HEIGHT_PX = 64

function sortPhotocards(list: Photocard[], order: SortOption): Photocard[] {
  const sorted = [...list]
  const albumKey = (pc: Photocard) => `${pc.album} ${pc.version}`.toLowerCase()
  switch (order) {
    case 'year-asc':
      return sorted.sort((a, b) => a.year - b.year || albumKey(a).localeCompare(albumKey(b)))
    case 'year-desc':
      return sorted.sort((a, b) => b.year - a.year || albumKey(a).localeCompare(albumKey(b)))
    case 'album-asc':
      return sorted.sort((a, b) => albumKey(a).localeCompare(albumKey(b)) || a.year - b.year)
    case 'album-desc':
      return sorted.sort((a, b) => albumKey(b).localeCompare(albumKey(a)) || a.year - b.year)
    default:
      return sorted
  }
}

export default function Group() {
  const { groupId } = useParams<{ groupId: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  const [photocards, setPhotocards] = useState<Photocard[]>([])
  const [totalPhotocards, setTotalPhotocards] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadMoreLoading, setLoadMoreLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasMorePhotocards = photocards.length < totalPhotocards

  const handleLoadMorePhotocards = () => {
    const id = groupId || ''
    if (!id || loadMoreLoading || !hasMorePhotocards) return
    setLoadMoreLoading(true)
    api
      .getPhotocardsByGroup(id, { limit: 40, offset: photocards.length })
      .then((data) => {
        setPhotocards((prev) => [...prev, ...data.photocards])
        setTotalPhotocards(data.totalPhotocards)
      })
      .catch(() => {})
      .finally(() => setLoadMoreLoading(false))
  }

  const [memberFilter, setMemberFilter] = useState<string>('all')
  const [albumFilter, setAlbumFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption | null>(null)
  const [showFixedFilters, setShowFixedFilters] = useState(false)
  const filterRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = groupId || ''
    if (!id) {
      setGroup(null)
      setPhotocards([])
      setTotalPhotocards(0)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      api.getGroup(id),
      api.getPhotocardsByGroup(id, { limit: 40, offset: 0 }),
    ])
      .then(([g, data]) => {
        if (!cancelled) {
          setGroup(g)
          setPhotocards(data.photocards)
          setTotalPhotocards(data.totalPhotocards)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [groupId])

  useEffect(() => {
    const handleScroll = () => {
      const el = filterRowRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      setShowFixedFilters(top <= HEADER_HEIGHT_PX)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Get unique albums
  const albums = useMemo(() => {
    return [...new Set(photocards.map(pc => pc.album))]
  }, [photocards])
  
  // Filter and sort photocards
  const filteredPhotocards = useMemo(() => {
    const filtered = photocards.filter(pc => {
      const memberMatch = memberFilter === 'all' || pc.memberId === memberFilter
      const albumMatch = albumFilter === 'all' || pc.album === albumFilter
      return memberMatch && albumMatch
    })
    return sortPhotocards(filtered, sortBy ?? 'year-asc')
  }, [photocards, memberFilter, albumFilter, sortBy])

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.empty}>
              <p>Loading...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.notFound}>
            <h1>{error || 'Group not found'}</h1>
            <Link to="/search" className={styles.backLink}>Back to browse</Link>
          </div>
        </main>
      </div>
    )
  }

  const totalCards = totalPhotocards

  return (
    <div className={styles.page}>
      <Header />
      <PageIndicator 
        title={group.name}
        subtitle={group.koreanName}
        imageUrl={group.imageUrl}
      />

      {/* Fixed filter bar: only visible after scrolling past the in-flow filters */}
      <div className={`${styles.filterBarFixed} ${showFixedFilters ? styles.filterBarFixedVisible : ''}`}>
        <FilterMenu
          memberOptions={[
            { value: 'all', label: 'All' },
            ...group.members.map(m => ({ value: m.id, label: m.name }))
          ]}
          albumOptions={[
            { value: 'all', label: 'All' },
            ...albums.map(album => ({ value: album, label: album === '_other' ? 'Other' : album }))
          ]}
          memberValue={memberFilter}
          albumValue={albumFilter}
          onMemberChange={setMemberFilter}
          onAlbumChange={setAlbumFilter}
        />
        <SortMenu value={sortBy} onChange={setSortBy} />
      </div>
      
      <main className={styles.main}>
        {/* Hero Section (group photo/info) */}
        <section className={styles.hero}>
          <div className={styles.heroBackground}>
            <img src={group.imageUrl} alt="" className={styles.heroBgImage} />
            <div className={styles.heroOverlay} />
          </div>
          
          <div className={styles.heroContent}>
            <div className={styles.groupInfo}>
              <img src={group.imageUrl} alt={group.name} className={styles.groupImage} />
              <div className={styles.groupDetails}>
                <h1 className={styles.groupName}>{group.name}</h1>
                <p className={styles.koreanName}>{group.koreanName}</p>
                <div className={styles.meta}>
                  <span>{group.company}</span>
                  <span className={styles.dot}>·</span>
                  <span>Since {group.debutYear}</span>
                </div>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statNum}>{group.members.length}</span>
                    <span className={styles.statLabel}>Members</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statNum}>{totalCards}</span>
                    <span className={styles.statLabel}>Photocards</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* In-flow filters: single filter icon; fixed bar appears when scrolled past */}
        <div className={`${styles.filterWrap} ${showFixedFilters ? styles.filterWrapHidden : ''}`} ref={filterRowRef}>
          <div className={styles.filterStickyRow}>
            <FilterMenu
              memberOptions={[
                { value: 'all', label: 'All' },
                ...group.members.map(m => ({ value: m.id, label: m.name }))
              ]}
              albumOptions={[
                { value: 'all', label: 'All' },
                ...albums.map(album => ({ value: album, label: album === '_other' ? 'Other' : album }))
              ]}
              memberValue={memberFilter}
              albumValue={albumFilter}
              onMemberChange={setMemberFilter}
              onAlbumChange={setAlbumFilter}
            />
            <SortMenu value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        <div className={styles.container}>
          <section className={styles.section}>
            <div className={styles.photocardsSection}>
              <div className={styles.photocardsGrid}>
                {filteredPhotocards.map(pc => (
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

            {filteredPhotocards.length === 0 && (
              <div className={styles.empty}>
                <p>No photocards found for this filter</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
