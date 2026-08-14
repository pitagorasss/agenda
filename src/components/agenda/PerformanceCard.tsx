import { useMemo, useState } from 'react'
import { Gauge } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcPerformance, yesterdayKey, todayKey } from '@/lib/performance'
import type { Task } from '@/types'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Period = 'd1' | 'today'

interface PerformanceCardProps {
  tasks: Task[]
  /** Filtro por data. Padrão: seletor D-1/Hoje. Passe uma string para fixar a data ou `null` para todas as tarefas. */
  dateKey?: string | null
}

export function PerformanceCard({ tasks, dateKey }: PerformanceCardProps) {
  const [period, setPeriod] = useState<Period>('d1')

  const fixedDate = typeof dateKey === 'string' ? dateKey : null
  const allTasks = dateKey === null

  const resolvedDateKey = fixedDate ?? (period === 'd1' ? yesterdayKey() : todayKey())
  const effectiveDateKey = allTasks ? null : resolvedDateKey

  const perf = useMemo(
    () => calcPerformance(tasks, effectiveDateKey),
    [tasks, effectiveDateKey],
  )

  const statusColor = perf.rate >= 80 ? 'text-brand-green' : perf.rate >= 50 ? 'text-amber-500' : 'text-red-500'
  const dateLabel = effectiveDateKey
    ? format(parseISO(`${effectiveDateKey}T00:00:00`), "EEEE, dd 'de' MMMM", { locale: ptBR })
    : null
  const isD1 = effectiveDateKey ? period === 'd1' : false

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4 text-brand-blue" />
          Performance
          {dateLabel && (
            <span className="text-xs font-normal text-muted-foreground capitalize">
              · {dateLabel} ({isD1 ? 'D-1' : 'Hoje'})
            </span>
          )}
          {!fixedDate && !allTasks && (
            <div className="ml-auto flex items-center gap-0.5 rounded-full bg-muted p-0.5">
              {(['d1', 'today'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                    period === p
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {p === 'd1' ? 'D-1' : 'Hoje'}
                </button>
              ))}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <span className={cn('text-3xl font-bold', statusColor)}>{perf.rate}%</span>
          <span className="text-xs text-muted-foreground">
            {perf.completed}/{perf.total} concluídas
            {perf.overdue > 0 && (
              <span className="text-amber-500">
                {' '}· {perf.overdue} {isD1 ? 'atrasada' : 'pendente'}
                {perf.overdue > 1 ? 's' : ''}
              </span>
            )}
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              perf.rate >= 80 ? 'bg-brand-green' : perf.rate >= 50 ? 'bg-amber-500' : 'bg-red-500',
            )}
            style={{ width: `${perf.rate}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}