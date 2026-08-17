// Selo visual que exibe a prioridade da tarefa com uma cor correspondente.
import { cn } from '@/lib/utils'
import { PRIORITY_LABELS } from '@/lib/performance' // Rótulos em português das prioridades.

type Priority = 'baixa' | 'media' | 'alta'

// Cores de fundo/texto para cada nível de prioridade.
const styles: Record<Priority, string> = {
  baixa: 'bg-emerald-500/15 text-emerald-600', // Verde para baixa.
  media: 'bg-amber-500/15 text-amber-600', // Amarelo para média.
  alta: 'bg-red-500/15 text-red-600', // Vermelho para alta.
}

// Componente do selo; assume "media" se nenhuma prioridade for informada.
export function PriorityBadge({ priority, className }: { priority?: Priority; className?: string }) {
  const p = priority ?? 'media'
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0', styles[p], className)}>
      {PRIORITY_LABELS[p]}
    </span>
  )
}