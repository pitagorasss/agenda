// Utilitários de cálculo de desempenho/performance diária das tarefas.
import type { Task } from '@/types' // Tipo de tarefa usado nos cálculos.

// Rótulos em português para os níveis de prioridade das tarefas.
export const PRIORITY_LABELS: Record<'baixa' | 'media' | 'alta', string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

// Estrutura que resume o desempenho de um dia.
export interface PerformanceResult {
  rate: number // Percentual de conclusão (0 a 100).
  total: number // Total de tarefas do dia.
  completed: number // Quantidade concluída.
  overdue: number // Quantidade de tarefas ainda pendentes do dia (contadas como "atrasadas" apenas em D-1).
}

// Retorna a chave "YYYY-MM-DD" do dia anterior à data fornecida (padrão: hoje).
export function yesterdayKey(now = new Date()): string {
  const d = new Date(now)
  d.setDate(d.getDate() - 1) // Volta um dia.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Retorna a chave "YYYY-MM-DD" da data fornecida (padrão: hoje).
export function todayKey(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Calcula a performance de um dia a partir das tarefas.
// Por padrão usa o dia de ontem (dateKey = yesterdayKey()).
// Se dateKey for null, considera todas as tarefas fornecidas.
export function calcPerformance(
  tasks: Task[],
  dateKey: string | null = yesterdayKey(),
): PerformanceResult {
  // Filtra as tarefas da data específica (ou usa todas se dateKey for null).
  const dayTasks = dateKey
    ? tasks.filter((t) => t.date === dateKey)
    : tasks

  const completed = dayTasks.filter((t) => t.status === 'completed') // Tarefas concluídas.
  const overdue = dayTasks.filter((t) => t.status === 'pending') // Tarefas ainda pendentes.
  const total = dayTasks.length

  // Percentual de conclusão: 100 se não houver tarefas, senão concluídas/total.
  const rate = total === 0 ? 100 : Math.round((completed.length / total) * 100)

  return { rate, total, completed: completed.length, overdue: overdue.length }
}