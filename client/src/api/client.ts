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
  totalPhotocards: number
}

const FETCH_TIMEOUT_MS = 20000

async function get<T>(path: string): Promise<T> {
  const url = `${apiBase}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, { signal: controller.signal })
  } catch (err) {
    clearTimeout(timeoutId)
    const msg =
      err instanceof Error ? err.message : String(err)
    const isTimeout = msg.toLowerCase().includes('abort')
    throw new Error(
      isTimeout
        ? `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s. Is the API server running? If using MongoDB, check it is reachable.`
        : `API request failed: ${msg}. ` +
            (url.startsWith('http') ? 'Check the API server is running and CORS is allowed.' : 'Ensure the dev server proxy target is correct (VITE_API_PROXY_TARGET).')
    )
  }
  clearTimeout(timeoutId)
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

  /** Get photocards for a group (paginated). */
  getPhotocardsByGroup: (
    groupId: string,
    options?: { limit?: number; offset?: number }
  ) => {
    const params = new URLSearchParams()
    const limit = options?.limit ?? 40
    const offset = options?.offset ?? 0
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    return get<{ photocards: Photocard[]; totalPhotocards: number }>(
      `/photocards/by-group/${encodeURIComponent(groupId)}?${params.toString()}`
    )
  },

  /** Search groups, members, and photocards (photocards paginated). */
  search: (
    q: string,
    options?: { pcLimit?: number; pcOffset?: number }
  ) => {
    const params = new URLSearchParams({ q })
    const limit = options?.pcLimit ?? 40
    const offset = options?.pcOffset ?? 0
    params.set('pc_limit', String(limit))
    params.set('pc_offset', String(offset))
    return get<SearchResult>(`/search?${params.toString()}`)
  },

  /** Get all data (for empty search) */
  searchAll: () => get<SearchResult>('/search/all'),
}
