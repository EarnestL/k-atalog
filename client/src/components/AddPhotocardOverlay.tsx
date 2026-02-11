import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api/client'
import { useAddPhotocard } from '../contexts/AddPhotocardContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import styles from './AddPhotocardOverlay.module.css'

const BUCKET = 'photocards'
const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

function normalizePathPart(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export default function AddPhotocardOverlay() {
  const { isOpen, close } = useAddPhotocard()
  const { user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    memberName: '',
    groupName: '',
    year: new Date().getFullYear(),
    type: 'album' as 'album' | 'other',
    album: '',
    version: '',
    description: '',
    frontFile: null as File | null,
    backFile: null as File | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!form.frontFile) {
      setError('Photo card front is required')
      return
    }
    if (form.frontFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`Front image must be under ${MAX_FILE_SIZE_MB}MB`)
      return
    }
    if (form.backFile && form.backFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`Back image must be under ${MAX_FILE_SIZE_MB}MB`)
      return
    }
    setSubmitting(true)
    try {
      await supabase.auth.refreshSession()
      const album = form.type === 'album' ? form.album : '_other'
      const version = form.type === 'album' ? form.version : form.description
      const ext = form.frontFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const frontId = crypto.randomUUID()
      const frontPath = `${normalizePathPart(form.groupName)}/${normalizePathPart(album)}/${normalizePathPart(form.memberName)}/${frontId}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(frontPath, form.frontFile, { upsert: false })
      if (uploadErr) throw new Error(uploadErr.message)
      const { data: frontData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(frontPath)
      const imageUrl = frontData.publicUrl

      let backImageUrl: string | undefined
      if (form.backFile) {
        const backExt = form.backFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const backId = crypto.randomUUID()
        const backPath = `${normalizePathPart(form.groupName)}/${normalizePathPart(album)}/${normalizePathPart(form.memberName)}/${backId}.${backExt}`
        const { error: backUploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(backPath, form.backFile, { upsert: false })
        if (backUploadErr) throw new Error(backUploadErr.message)
        const { data: backData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(backPath)
        backImageUrl = backData.publicUrl
      }

      await api.createPhotocard({
        memberName: form.memberName,
        groupName: form.groupName,
        album,
        version,
        year: form.year,
        type: form.type === 'album' ? 'album' : 'special',
        imageUrl,
        backImageUrl,
      })
      setSuccess(true)
      setForm({
        memberName: '',
        groupName: '',
        year: new Date().getFullYear(),
        type: 'album',
        album: '',
        version: '',
        description: '',
        frontFile: null,
        backFile: null,
      })
      frontInputRef.current && (frontInputRef.current.value = '')
      backInputRef.current && (backInputRef.current.value = '')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add photocard'
      if (msg.includes('Authentication required')) {
        setError('Authentication failed. Please log in again and try again.')
      } else {
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null
  if (loading || !user) return null

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={close}
      role="presentation"
    >
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Add photocard"
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={close}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
        <div className={styles.cardHeader}>
          <h2 className={styles.title}>Add photocard</h2>
          <p className={styles.subtitle}>
            Upload a new photocard to the catalog
          </p>
        </div>
        <div className={styles.formScroll}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {success && (
              <div className={styles.success}>
                Photocard added successfully. You can add another below.
              </div>
            )}
            {error && <div className={styles.error}>{error}</div>}
            <div>
              <label htmlFor="memberName" className={styles.label}>
                Member name
              </label>
              <input
                id="memberName"
                type="text"
                className={styles.input}
                value={form.memberName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, memberName: e.target.value }))
                }
                placeholder="e.g. Karina"
                required
              />
            </div>
            <div>
              <label htmlFor="groupName" className={styles.label}>
                Group name
              </label>
              <input
                id="groupName"
                type="text"
                className={styles.input}
                value={form.groupName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, groupName: e.target.value }))
                }
                placeholder="e.g. Aespa"
                required
              />
            </div>
            <div>
              <label htmlFor="year" className={styles.label}>
                Year
              </label>
              <input
                id="year"
                type="number"
                className={styles.input}
                value={form.year}
                onChange={(e) =>
                  setForm((f) => ({ ...f, year: parseInt(e.target.value, 10) || 0 }))
                }
                min={2000}
                max={2030}
                required
              />
            </div>
            <div>
              <span className={styles.label}>Type</span>
              <div className={styles.typeSelector}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="type"
                    checked={form.type === 'album'}
                    onChange={() =>
                      setForm((f) => ({ ...f, type: 'album' }))
                    }
                  />
                  Album
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="type"
                    checked={form.type === 'other'}
                    onChange={() =>
                      setForm((f) => ({ ...f, type: 'other' }))
                    }
                  />
                  Other
                </label>
              </div>
            </div>
            {form.type === 'album' ? (
              <>
                <div>
                  <label htmlFor="album" className={styles.label}>
                    Album
                  </label>
                  <input
                    id="album"
                    type="text"
                    className={styles.input}
                    value={form.album}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, album: e.target.value }))
                    }
                    placeholder="e.g. Armageddon"
                    required={form.type === 'album'}
                  />
                </div>
                <div>
                  <label htmlFor="version" className={styles.label}>
                    Version
                  </label>
                  <input
                    id="version"
                    type="text"
                    className={styles.input}
                    value={form.version}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, version: e.target.value }))
                    }
                    placeholder="e.g. Superbeing Ver"
                    required={form.type === 'album'}
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="description" className={styles.label}>
                  Description
                </label>
                <input
                  id="description"
                  type="text"
                  className={styles.input}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="e.g. Fansign event 2024"
                  required={form.type === 'other'}
                />
              </div>
            )}
            <div>
              <label htmlFor="front" className={styles.label}>
                Photo card front (required)
              </label>
              <input
                ref={frontInputRef}
                id="front"
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    frontFile: e.target.files?.[0] ?? null,
                  }))
                }
                required
              />
              {form.frontFile && (
                <p className={styles.fileHint}>
                  {form.frontFile.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="back" className={styles.label}>
                Photo card back (optional)
              </label>
              <input
                ref={backInputRef}
                id="back"
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    backFile: e.target.files?.[0] ?? null,
                  }))
                }
              />
              {form.backFile && (
                <p className={styles.fileHint}>{form.backFile.name}</p>
              )}
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={close}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submit}
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add photocard'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}
