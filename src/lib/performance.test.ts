import { describe, it, expect } from 'vitest'
import { yesterdayKey, todayKey, calcPerformance, PRIORITY_LABELS } from '@/lib/performance'
import type { Task } from '@/types'

function task(partial: Partial<Task> & { id: string; title: string; date: string }): Task {
  return { created_by: 'u', created_at: '', ...partial } as Task
}

describe('todayKey / yesterdayKey', () => {
  it('gera chaves ISO', () => {
    const now = new Date(2026, 7, 14, 12, 0, 0)
    expect(todayKey(now)).toBe('2026-08-14')
    expect(yesterdayKey(now)).toBe('2026-08-13')
  })
})

describe('calcPerformance', () => {
  const tasks: Task[] = [
    task({ id: '1', title: 'a', date: '2026-08-13', status: 'completed' }),
    task({ id: '2', title: 'b', date: '2026-08-13', status: 'pending' }),
    task({ id: '3', title: 'c', date: '2026-08-13', status: 'pending' }),
    task({ id: '4', title: 'd', date: '2026-08-12', status: 'completed' }),
  ]

  it('calcula taxa apenas do dia alvo', () => {
    const r = calcPerformance(tasks, '2026-08-13')
    expect(r.total).toBe(3)
    expect(r.completed).toBe(1)
    expect(r.overdue).toBe(2)
    expect(r.rate).toBe(33)
  })

  it('usa todas as tarefas quando dateKey é null', () => {
    const r = calcPerformance(tasks, null)
    expect(r.total).toBe(4)
    expect(r.completed).toBe(2)
    expect(r.rate).toBe(50)
  })

  it('retorna 100% quando não há tarefas no dia', () => {
    const r = calcPerformance([], '2026-08-13')
    expect(r.total).toBe(0)
    expect(r.rate).toBe(100)
  })
})

describe('PRIORITY_LABELS', () => {
  it('contém os três níveis', () => {
    expect(PRIORITY_LABELS).toEqual({ baixa: 'Baixa', media: 'Média', alta: 'Alta' })
  })
})