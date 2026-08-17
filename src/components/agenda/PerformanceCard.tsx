// Cartão que exibe a taxa de conclusão (performance) de tarefas de um dia.
import { useMemo, useState } from 'react'
import { Gauge } from 'lucide-react' // Ícone.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcPerformance, yesterdayKey, todayKey } from '@/lib/performance' // calcPerformance e chaves de data (D-1/Hoje).
import type { Task } from '@/types'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns' // Formatação de data.
import { ptBR } from 'date-fns/locale' // Locale em português.

// Período exibido: D-1 (ontem) ou Hoje.
type Period = 'd1' | 'today'

interface PerformanceCardProps {
  tasks: Task[]
  /** Filtro por data. Padrão: seletor D-1/Hoje. Passe uma string para fixar a data ou `null` para todas as tarefas. */
  dateKey?: string | null
}

export function PerformanceCard({ tasks, dateKey }: PerformanceCardProps) {
  const [period, setPeriod] = useState<Period>('d1') // Período selecionado.

  const fixedDate = typeof dateKey === 'string' ? dateKey : null // Data fixada (se fornecida).
  const allTasks = dateKey === null // Se deve considerar todas as tarefas.

  // Resolve a chave de data efetiva: a fixada, ou ontem/hoje conforme o período.
  const resolvedDateKey = fixedDate ?? (period === 'd1' ? yesterdayKey() : todayKey())
  const effectiveDateKey = allTasks ? null : resolvedDateKey

  // Calcula a performance (percentual, concluídas, pendentes) de forma memoizada.
  const perf = useMemo(
    () => calcPerformance(tasks, effectiveDateKey),
    [tasks, effectiveDateKey],
  )

  // Cor do percentual conforme a taxa (verde/âmbar/vermelho).
  const statusColor = perf.rate >= 80 ? 'text-brand-green' : perf.rate >= 50 ? 'text-amber-500' : 'text-red-500'
  // Rótulo do dia (ex.: "quinta-feira, 14 de agosto") quando há data específica.
  // O sufixo "T00:00:00" garante meia-noite no fuso local ao converter a chave em Date.
  const dateLabel = effectiveDateKey
    ? format(parseISO(`${effectiveDateKey}T00:00:00`), "EEEE, dd 'de' MMMM", { locale: ptBR })
    : null
  const isD1 = effectiveDateKey ? period === 'd1' : false // Se o período é D-1.

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
          {/* Seletor D-1 / Hoje (escondido quando a data é fixada ou todas as tarefas). */}
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
          {/* Percentual de conclusão com cor conforme a taxa. */}
          <span className={cn('text-3xl font-bold', statusColor)}>{perf.rate}%</span>
          {/* Resumo: concluídas/total e quantidade atrasada/pendente. */}
          <span className="text-xs text-muted-foreground">
            {perf.completed}/{perf.total} concluídas
            {perf.overdue > 0 && (
              <span className="text-amber-500">
                {' '}· {perf.overdue} {isD1 ? 'atrasada' : 'pendente'} {/* Em D-1 as pendentes de ontem já estão atrasadas; em "Hoje" são apenas pendentes. */}
                {perf.overdue > 1 ? 's' : ''}
              </span>
            )}
          </span>
        </div>
        {/* Barra de progresso da taxa. */}
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