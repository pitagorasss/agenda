import type { Task } from '@/types'
import { User } from 'lucide-react'

interface Props {
  task: Task
}

export function TaskCard({ task }: Props) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-3 border-l-4 hover:shadow-md transition-all duration-200"
      style={{ borderLeftColor: task.category?.color ?? '#888' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {task.time && (
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
              {task.time.slice(0, 5)}
            </span>
          )}
          <span className="text-sm font-medium truncate">{task.title}</span>
          {task.category && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
              style={{ backgroundColor: task.category.color + '20', color: task.category.color }}
            >
              {task.category.name}
            </span>
          )}
        </div>
        {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
      </div>
    </div>
  )
}
