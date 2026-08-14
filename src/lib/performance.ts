import type { Task } from '@/types'

export const PRIORITY_LABELS: Record<'baixa' | 'media' | 'alta', string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

export interface PerformanceResult {
  rate: number
  total: number
  completed: number
  overdue: number
}

export function yesterdayKey(now = new Date()): string {
  const d = new Date(now)
  d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function calcPerformance(
  tasks: Task[],
  dateKey: string | null = yesterdayKey(),
): PerformanceResult {
  const dayTasks = dateKey
    ? tasks.filter((t) => t.date === dateKey)
    : tasks

  const completed = dayTasks.filter((t) => t.status === 'completed')
  const overdue = dayTasks.filter((t) => t.status === 'pending')
  const total = dayTasks.length

  const rate = total === 0 ? 100 : Math.round((completed.length / total) * 100)

  return { rate, total, completed: completed.length, overdue: overdue.length }
}