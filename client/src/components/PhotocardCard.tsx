import { useState } from 'react'
import type { Photocard } from '../data/photocards'
import PhotocardModal from './PhotocardModal'
import styles from './PhotocardCard.module.css'

interface PhotocardCardProps {
  photocard: Photocard
  showMember?: boolean
}

export default function PhotocardCard({ photocard, showMember = false }: PhotocardCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const typeLabel: Record<string, string> = {
    album: 'Album',
    pob: 'POB',
    fansign: 'Fansign',
    special: 'Special'
  }
  const isOther = photocard.album === '_other'

  return (
    <>
      <div className={styles.card} onClick={() => setIsModalOpen(true)}>
        <div className={styles.imageWrapper}>
          <img 
            src={photocard.imageUrl} 
            alt={`${photocard.memberName} ${isOther ? photocard.version : photocard.album}`}
            className={styles.image}
            loading="lazy"
          />
          {photocard.type !== 'album' && (
            <span className={`${styles.type} ${styles[photocard.type]}`}>
              {typeLabel[photocard.type]}
            </span>
          )}
        </div>
        <div className={styles.content}>
          {showMember && (
            <span className={styles.memberTag}>
              {photocard.memberName}
            </span>
          )}
          {!isOther && <p className={styles.album}>{photocard.album}</p>}
          <p className={styles.description}>{photocard.version}</p>
        </div>
      </div>

      {isModalOpen && (
        <PhotocardModal 
          photocard={photocard} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  )
}
