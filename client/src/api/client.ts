/**
 * API client for Katalog backend.
 * Base URL is configurable via VITE_API_BASE_URL (see src/api/config.ts).
 */

import { apiBase } from './config'

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

/** Member in API responses; no groupId/groupName (use URL or parent group for context). */
export type Member = MemberData

export interface Group {
  id: string
  name: string
  koreanName: string
  company: string
  debutYear: number
  imageUrl: string
  members: Member[]
}

export interface SearchResult {
  groups: Group[]
  members: Member[]
  photocards: Photocard[]
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase}${path}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(res.status === 404 ? 'Not found' : text || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  /** List all groups with members */
  getGroups: () => get<Group[]>('/groups'),

  /** Get a single group by id */
  getGroup: (groupId: string) => get<Group>(`/groups/${encodeURIComponent(groupId)}`),

  /** List members of a group */
  getMembers: (groupId: string) =>
    get<Member[]>(`/groups/${encodeURIComponent(groupId)}/members`),

  /** Get a single member */
  getMember: (groupId: string, memberId: string) =>
    get<Member>(
      `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`
    ),

  /** Get photocards for a member */
  getMemberPhotocards: (groupId: string, memberId: string) =>
    get<Photocard[]>(
      `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/photocards`
    ),

  /** List all photocards */
  getPhotocards: () => get<Photocard[]>('/photocards'),

  /** Get photocards for a group */
  getPhotocardsByGroup: (groupId: string) =>
    get<Photocard[]>(`/photocards/by-group/${encodeURIComponent(groupId)}`),

  /** Search groups, members, and photocards */
  search: (q: string) =>
    get<SearchResult>(`/search?q=${encodeURIComponent(q)}`),

  /** Get all data (for empty search) */
  searchAll: () => get<SearchResult>('/search/all'),
}
