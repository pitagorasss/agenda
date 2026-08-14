import type { Profile } from '@/types'

export function toMin(t: string | null | undefined): number | null {
  if (!t) return null
  const parts = t.split(':').map(Number)
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
  return parts[0] * 60 + parts[1]
}

export function fmtTime(t: string): string {
  return t.slice(0, 5)
}

export function getUserName(id: string | null | undefined, users: Profile[]): string {
  if (!id) return '—'
  const u = users.find((u) => u.id === id)
  return u?.name ?? u?.email ?? '—'
}

export function formatDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function formatDateTime(d: string): string {
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '—'
  const dd = date.getDate().toString().padStart(2, '0')
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const hh = date.getHours().toString().padStart(2, '0')
  const min = date.getMinutes().toString().padStart(2, '0')
  return `${dd}/${mm}/${date.getFullYear()} ${hh}:${min}`
}