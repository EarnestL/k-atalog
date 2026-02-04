/** Types for catalog data (data is loaded via API in api/client.ts). */

export interface Photocard {
  id: string
  memberId: string
  memberName: string
  groupId: string
  groupName: string
  album: string
  version: string
  year: number
  type: 'album' | 'pob' | 'fansign' | 'special'
  imageUrl: string
  backImageUrl?: string
}

export interface MemberData {
  id: string
  name: string
  koreanName: string
  imageUrl: string
  photocardCount: number
}

/** Member in API responses (e.g. in group.members). No groupId/groupName; use URL or parent group for context. */
export type Member = MemberData

export interface GroupData {
  id: string
  name: string
  koreanName: string
  company: string
  debutYear: number
  imageUrl: string
  members: MemberData[]
}

export interface Group extends Omit<GroupData, 'members'> {
  members: Member[]
}
