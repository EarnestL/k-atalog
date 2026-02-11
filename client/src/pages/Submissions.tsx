import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Submission } from '../api/client'
import { useAddPhotocard } from '../contexts/AddPhotocardContext'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import styles from './Submissions.module.css'

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function Submissions() {
  const { user, loading } = useAuth()
  const { open: openAddPhotocard } = useAddPhotocard()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoadingList(true)
    setError(null)
    api
      .getSubmissions()
      .then(setSubmissions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoadingList(false))
  }, [user])

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>My submissions</h1>
          <p className={styles.subtitle}>
            History of photocards you have added or edited
          </p>

          {!user && !loading && (
            <div className={styles.empty}>
              <p>Log in to view your submissions</p>
              <Link to="/login" className={styles.addLink}>
                Log in
              </Link>
            </div>
          )}
          {user && (
            <>
              {error && <div className={styles.error}>{error}</div>}
              {loadingList && (
                <div className={styles.empty}>
                  <p>Loading...</p>
                </div>
              )}
              {!loadingList && !error && submissions.length === 0 && (
                <div className={styles.empty}>
                  <p>No submissions yet</p>
                  <button
                    type="button"
                    className={styles.addLink}
                    onClick={openAddPhotocard}
                  >
                    Add your first photocard
                  </button>
                </div>
              )}
              {!loadingList && !error && submissions.length > 0 && (
                <div className={styles.table}>
                  <div className={styles.headerRow}>
                    <span className={styles.colMember}>Member</span>
                    <span className={styles.colGroup}>Group</span>
                    <span className={styles.colAlbum}>Album</span>
                    <span className={styles.colVersion}>Version</span>
                    <span className={styles.colDescription}>Description</span>
                    <span className={styles.colYear}>Year</span>
                    <span className={styles.colStatus}>Status</span>
                    <span className={styles.colDate}>Submitted</span>
                  </div>
                  {submissions.map((sub) => (
                    <SubmissionRow key={sub.id} submission={sub} />
                  ))}
                </div>
              )}
            </>
          )}
          {loading && (
            <div className={styles.empty}>
              <p>Loading...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function SubmissionRow({ submission }: { submission: Submission }) {
  const statusClass =
    submission.status === 'accepted'
      ? styles.statusAccepted
      : submission.status === 'rejected'
        ? styles.statusRejected
        : styles.statusPending

  const isOther = submission.album === '_other'

  return (
    <div className={styles.row}>
      <span className={styles.colMember}>{submission.memberName}</span>
      <span className={styles.colGroup}>{submission.groupName}</span>
      <span className={styles.colAlbum}>{isOther ? '–' : submission.album}</span>
      <span className={styles.colVersion}>{isOther ? '–' : submission.version}</span>
      <span className={styles.colDescription}>{isOther ? submission.version : '–'}</span>
      <span className={styles.colYear}>{submission.year}</span>
      <span className={`${styles.colStatus} ${styles.statusBadge} ${statusClass}`}>
        {submission.status}
      </span>
      <span className={styles.colDate}>{formatDate(submission.submittedAt)}</span>
    </div>
  )
}
