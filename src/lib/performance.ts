import type { Task } from '@/types'

export const PRIORITY_WEIGHTS: Record<'baixa' | 'media' | 'alta', number> = {
  baixa: 1,
  media: 2,
  alta: 4,
}

export const PRIORITY_LABELS: Record<'baixa' | 'media' | 'alta', string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

export interface PriorityPenalty {
  priority: 'baixa' | 'media' | 'alta'
  count: number
  points: number
}

export interface PerformanceResult {
  rate: number
  total: number
  completed: number
  overdue: PriorityPenalty[]
  penalty: number
}

export function calcPerformance(tasks: Task[], today = new Date()): PerformanceResult {
  const todayKey = today.toISOString().slice(0, 10)

  const completed = tasks.filter((t) => t.status === 'completed')
  const total = tasks.length
  const ratio = total === 0 ? 100 : Math.round((completed.length / total) * 100)

  const overdueByPriority = tasks
    .filter((t) => t.status === 'pending' && !t.deleted_at && t.date < todayKey)
    .reduce<Record<'baixa' | 'media' | 'alta', number>>(
      (acc, t) => {
        const p = (t.priority ?? 'media') as 'baixa' | 'media' | 'alta'
        acc[p] += 1
        return acc
      },
      { baixa: 0, media: 0, alta: 0 },
    )

  const overdue: PriorityPenalty[] = (['alta', 'media', 'baixa'] as const)
    .map((priority) => ({
      priority,
      count: overdueByPriority[priority],
      points: overdueByPriority[priority] * PRIORITY_WEIGHTS[priority],
    }))
    .filter((p) => p.count > 0)

  const penalty = overdue.reduce((sum, p) => sum + p.points, 0)
  const rate = Math.max(0, ratio - penalty)

  return { rate, total, completed: completed.length, overdue, penalty }
}