/**
 * API client for Katalog backend.
 * Base URL is configurable via VITE_API_BASE_URL (see src/api/config.ts).
 * Sends Supabase access token when user is logged in.
 */

import { supabase } from '../lib/supabase'
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
  /** @deprecated Computed from photocard objects; no longer from API. */
  photocardCount?: number
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

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

async function get<T>(path: string): Promise<T> {
  const url = `${apiBase}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  const headers = await getAuthHeaders()
  let res: Response
  try {
    res = await fetch(url, { signal: controller.signal, headers })
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

async function post<T>(path: string, body: unknown): Promise<T> {
  const url = `${apiBase}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  const headers = await getAuthHeaders()
  const allHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: allHeaders,
      body: JSON.stringify(body),
    })
  } catch (err) {
    clearTimeout(timeoutId)
    const msg = err instanceof Error ? err.message : String(err)
    const isTimeout = msg.toLowerCase().includes('abort')
    throw new Error(
      isTimeout
        ? `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s`
        : `API request failed: ${msg}`
    )
  }
  clearTimeout(timeoutId)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface Submission {
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
  userEmail: string
  submittedAt: string
  status: 'accepted' | 'rejected' | 'pending'
  photocardId?: string
}

export interface PhotocardCreatePayload {
  memberName: string
  groupName: string
  album: string
  version: string
  year: number
  type: 'album' | 'special'
  imageUrl: string
  backImageUrl?: string
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

  /** Get current user (requires auth). Returns 401 if not authenticated. */
  getMe: () =>
    get<{ user: { id: string; email?: string; role?: string } }>('/auth/me'),

  /** Create a new photocard (requires auth). */
  createPhotocard: (data: PhotocardCreatePayload) =>
    post<Photocard>('/photocards', data),

  /** Get current user's submissions (requires auth). */
  getSubmissions: () => get<Submission[]>('/submissions'),
}
