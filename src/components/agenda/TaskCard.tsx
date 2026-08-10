import type { Task } from '@/types'

interface Props {
  task: Task
}

export function TaskCard({ task }: Props) {
  const completed = task.status === 'completed'
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 border-l-4 hover:shadow-md transition-all duration-200 ${completed ? 'bg-muted/40' : ''}`}
      style={{ borderLeftColor: task.category?.color ?? '#888' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {completed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500 text-white font-medium shrink-0">
              Concluída
            </span>
          )}
          {task.time && (
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
              {task.time.slice(0, 5)}
            </span>
          )}
          <span className={`text-sm font-medium truncate ${completed ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </span>
          {task.category && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
              style={{ backgroundColor: task.category.color + '20', color: task.category.color }}
            >
              {task.category.name}
            </span>
          )}
        </div>
        {task.description && (
          <p className={`text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap ${completed ? 'line-through' : ''}`}>
            {task.description}
          </p>
        )}
        {task.observation && (
          <p className="text-xs mt-1 whitespace-pre-wrap border-l-2 border-brand-green pl-2 text-muted-foreground">
            <span className="font-medium text-foreground">Obs:</span> {task.observation}
          </p>
        )}
      </div>
    </div>
  )
}
