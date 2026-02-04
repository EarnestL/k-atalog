import { useParams, Link } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import Header from '../components/Header'
import PageIndicator from '../components/PageIndicator'
import PhotocardCard from '../components/PhotocardCard'
import { api } from '../api/client'
import type { Group, Member, Photocard } from '../data/photocards'
import styles from './Member.module.css'

export default function Member() {
  const { groupId, memberId } = useParams<{ groupId: string; memberId: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [photocards, setPhotocards] = useState<Photocard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const gid = groupId || ''
    const mid = memberId || ''
    if (!gid || !mid) {
      setGroup(null)
      setMember(null)
      setPhotocards([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      api.getGroup(gid),
      api.getMember(gid, mid),
      api.getMemberPhotocards(gid, mid),
    ])
      .then(([g, m, pcs]) => {
        if (!cancelled) {
          setGroup(g)
          setMember(m)
          setPhotocards(pcs)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [groupId, memberId])

  const albums = useMemo(() => {
    return [...new Set(photocards.map(pc => pc.album))]
  }, [photocards])

  const filteredPhotocards = useMemo(() => {
    if (filter === 'all') return photocards
    return photocards.filter(pc => pc.album === filter)
  }, [photocards, filter])

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

  if (error || !group || !member) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.notFound}>
            <h1>{error || 'Member not found'}</h1>
            <Link to="/search" className={styles.backLink}>Back to browse</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Header />
      <PageIndicator 
        title={member.name}
        subtitle={`${group.name} · ${member.koreanName}`}
        imageUrl={member.imageUrl}
      />
      
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroBackground}>
            <img src={member.imageUrl} alt="" className={styles.heroBgImage} />
            <div className={styles.heroOverlay} />
          </div>
          
          <div className={styles.heroContent}>
            <div className={styles.memberInfo}>
              <img src={member.imageUrl} alt={member.name} className={styles.memberImage} />
              <div className={styles.memberDetails}>
                <span className={styles.groupBadge}>{group.name}</span>
                <h1 className={styles.memberName}>{member.name}</h1>
                <p className={styles.koreanName}>{member.koreanName}</p>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statNum}>{member.photocardCount}</span>
                    <span className={styles.statLabel}>Photocards</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statNum}>{albums.length}</span>
                    <span className={styles.statLabel}>Albums</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.container}>
          {/* Filter Section */}
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <h2 className={styles.sectionTitle}>Photocards</h2>
              <span className={styles.count}>{filteredPhotocards.length} cards</span>
            </div>
            
            <div className={styles.filters}>
              <button
                className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              {albums.map(album => (
                <button
                  key={album}
                  className={`${styles.filterBtn} ${filter === album ? styles.active : ''}`}
                  onClick={() => setFilter(album)}
                >
                  {album}
                </button>
              ))}
            </div>
          </div>

          {/* Photocards Grid */}
          <div className={styles.photocardsGrid}>
            {filteredPhotocards.map(pc => (
              <PhotocardCard key={pc.id} photocard={pc} />
            ))}
          </div>

          {/* Empty State */}
          {filteredPhotocards.length === 0 && (
            <div className={styles.empty}>
              <p>No photocards found for this filter</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
