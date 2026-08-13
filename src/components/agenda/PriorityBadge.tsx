import { cn } from '@/lib/utils'
import { PRIORITY_LABELS } from '@/lib/performance'

type Priority = 'baixa' | 'media' | 'alta'

const styles: Record<Priority, string> = {
  baixa: 'bg-emerald-500/15 text-emerald-600',
  media: 'bg-amber-500/15 text-amber-600',
  alta: 'bg-red-500/15 text-red-600',
}

export function PriorityBadge({ priority, className }: { priority?: Priority; className?: string }) {
  const p = priority ?? 'media'
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0', styles[p], className)}>
      {PRIORITY_LABELS[p]}
    </span>
  )
}