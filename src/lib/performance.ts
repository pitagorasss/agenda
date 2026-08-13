import type { RoutineSlot, RoutineSlotCompletion, Task } from '@/types'

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

export interface RoutinePerformance {
  slots: RoutineSlot[]
  completions: RoutineSlotCompletion[]
  from: string
  to: string
}

export interface PerformanceResult {
  rate: number
  total: number
  completed: number
  overdue: PriorityPenalty[]
  penalty: number
  routineTotal: number
  routineCompleted: number
}

export function routineOccurrences(slots: RoutineSlot[], from: string, to: string): Map<string, RoutineSlot> {  const out = new Map<string, RoutineSlot>()
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  const cursor = new Date(start)
  while (cursor <= end) {
    const dateKey = cursor.toISOString().slice(0, 10)
    const weekday = cursor.getDay()
    for (const s of slots) {
      if (s.weekday === weekday) out.set(`${s.id}|${dateKey}`, s)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

export function calcPerformance(
  tasks: Task[],
  today = new Date(),
  routine?: RoutinePerformance,
): PerformanceResult {
  const todayKey = today.toISOString().slice(0, 10)

  const completed = tasks.filter((t) => t.status === 'completed')
  const total = tasks.length

  const occurrences = routine
    ? routineOccurrences(routine.slots, routine.from, routine.to)
    : new Map<string, RoutineSlot>()
  const doneKeys = new Set(
    (routine?.completions ?? []).map((c) => `${c.slot_id}|${c.date}`),
  )
  const routineTotal = occurrences.size
  const routineCompleted = [...occurrences.keys()].filter((k) => doneKeys.has(k)).length

  const ratio = total + routineTotal === 0 ? 100 : Math.round(((completed.length + routineCompleted) / (total + routineTotal)) * 100)

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

  return { rate, total, completed: completed.length, overdue, penalty, routineTotal, routineCompleted }
}
