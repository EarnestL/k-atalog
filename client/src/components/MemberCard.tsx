import { Link } from 'react-router-dom'
import type { Member } from '../data/photocards'
import styles from './MemberCard.module.css'

interface MemberCardProps {
  member: Member
  /** Required for the member link; not on member object from API. */
  groupId: string
  /** Count from photocard objects; pass from parent. Falls back to 0 if omitted. */
  photocardCount?: number
}

export default function MemberCard({ member, groupId, photocardCount = 0 }: MemberCardProps) {
  return (
    <Link to={`/group/${groupId}/member/${member.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <img 
          src={member.imageUrl} 
          alt={member.name}
          className={styles.image}
          loading="lazy"
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{member.name}</h3>
        <p className={styles.koreanName}>{member.koreanName}</p>
        <span className={styles.count}>{photocardCount} photocards</span>
      </div>
    </Link>
  )
}
