import { Gauge } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PRIORITY_LABELS, PRIORITY_WEIGHTS, calcPerformance } from '@/lib/performance'
import type { RoutinePerformance } from '@/lib/performance'
import type { Task } from '@/types'
import { cn } from '@/lib/utils'

const priorityDot: Record<'baixa' | 'media' | 'alta', string> = {
  baixa: 'bg-emerald-500',
  media: 'bg-amber-500',
  alta: 'bg-red-500',
}

export function PerformanceCard({ tasks, routine }: { tasks: Task[]; routine?: RoutinePerformance }) {
  const perf = calcPerformance(tasks, new Date(), routine)
  const statusColor = perf.rate >= 80 ? 'text-brand-green' : perf.rate >= 50 ? 'text-amber-500' : 'text-red-500'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4 text-brand-blue" />
          Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <span className={cn('text-3xl font-bold', statusColor)}>{perf.rate}%</span>
          <span className="text-xs text-muted-foreground">
            {perf.completed}/{perf.total} concluídas
            {perf.routineTotal > 0 && ` · ${perf.routineCompleted}/${perf.routineTotal} rotina`}
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
        {perf.penalty > 0 ? (
          <ul className="mt-3 space-y-1 text-xs">
            {perf.overdue.map((p) => (
              <li key={p.priority} className="flex items-center gap-2 text-muted-foreground">
                <span className={cn('h-2 w-2 rounded-full shrink-0', priorityDot[p.priority])} />
                {PRIORITY_LABELS[p.priority]}: {p.count} atrasada{p.count > 1 ? 's' : ''} (−{p.points}%
                {PRIORITY_WEIGHTS[p.priority] > 1 ? ` × ${PRIORITY_WEIGHTS[p.priority]}` : ''})
              </li>
            ))}
            <li className="pt-1 text-foreground font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted-foreground shrink-0" />
              Penalidade total: −{perf.penalty}%
            </li>
          </ul>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Sem tarefas atrasadas penalizando a performance.</p>
        )}
      </CardContent>
    </Card>
  )
}
