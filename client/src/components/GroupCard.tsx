import { Link } from 'react-router-dom'
import type { Group } from '../data/photocards'
import styles from './GroupCard.module.css'

interface GroupCardProps {
  group: Group
}

export default function GroupCard({ group }: GroupCardProps) {
  return (
    <Link to={`/group/${group.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <img 
          src={group.imageUrl} 
          alt={group.name}
          className={styles.image}
          loading="lazy"
        />
        <div className={styles.overlay}>
          <h3 className={styles.name}>{group.name}</h3>
        </div>
      </div>
    </Link>
  )
}
