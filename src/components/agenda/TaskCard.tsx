import { useState } from 'react'
import type { Task } from '@/types'
import { useAgendaStore } from '@/stores/agendaStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, MessageSquarePlus, RotateCcw, CalendarClock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ForecastDialog } from '@/components/agenda/ForecastDialog'

interface Props {
  task: Task
  showDate?: boolean
}

const OBS_MAX = 500

export function TaskCard({ task, showDate }: Props) {
  const { markTaskCompleted, markTaskPending, updateTask, users } = useAgendaStore()
  const user = useAuthStore((s) => s.user)
  const [editingObs, setEditingObs] = useState(false)
  const [obsText, setObsText] = useState(task.observation ?? '')
  const [forecastOpen, setForecastOpen] = useState(false)

  const completed = task.status === 'completed'
  const forecast = task.status === 'forecast'
  const currentUserRole = users.find((u) => u.id === user?.id)?.role ?? 'user'

  const canModify =
    task.created_by === user?.id || task.assigned_to === user?.id || currentUserRole === 'admin'

  const canComplete = canModify && !completed

  const handleComplete = async () => {
    const ok = await markTaskCompleted(task.id, obsText)
    if (ok) {
      setEditingObs(false)
      setObsText('')
    }
  }

  const handlePending = async () => {
    const ok = await markTaskPending(task.id, obsText)
    if (ok) {
      setEditingObs(false)
      setObsText('')
    }
  }

  const handleSaveObs = async () => {
    await updateTask(task.id, { observation: obsText.trim() || null })
    setEditingObs(false)
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 border-l-4 hover:shadow-md transition-all duration-200 ${completed ? 'bg-muted/40' : ''}`}
      style={{ borderLeftColor: task.category?.color ?? '#888' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {completed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-green text-white font-medium shrink-0">
              Concluída
            </span>
          )}
          {forecast && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-blue text-white font-medium shrink-0">
              Prevista
            </span>
          )}
          {showDate && task.date && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 font-semibold shrink-0">
              {format(parseISO(task.date), 'dd/MM')}
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
        {forecast && task.forecast_date && (
          <p className="text-xs mt-1 whitespace-pre-wrap border-l-2 border-brand-blue pl-2 text-muted-foreground">
            <span className="font-medium text-foreground">
              Prevista para ser concluída em {format(parseISO(task.forecast_date), 'dd/MM/yyyy')}
              {task.forecast_time ? ` às ${task.forecast_time.slice(0, 5)}` : ''}
            </span>
            {task.forecast_observation && (
              <>
                {' — '}
                {task.forecast_observation}
              </>
            )}
          </p>
        )}

        {editingObs ? (
          <div className="space-y-1.5 mt-2">
            <Textarea
              value={obsText}
              onChange={(e) => setObsText(e.target.value.slice(0, OBS_MAX))}
              placeholder={`Adicionar observação (${OBS_MAX} caracteres)`}
              autoGrow
              autoFocus
              maxLength={OBS_MAX}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditingObs(false); setObsText(task.observation ?? '') }}>
                Cancelar
              </Button>
              <Button size="sm" variant="outline" onClick={handleSaveObs}>
                Salvar
              </Button>
              {canComplete && (
                <Button size="sm" onClick={handleComplete}>
                  Concluir
                </Button>
              )}
              {completed && canModify && (
                <Button size="sm" variant="secondary" onClick={handlePending}>
                  <RotateCcw className="h-3.5 w-3.5" /> Marcar pendente
                </Button>
              )}
            </div>
          </div>
        ) : (
          canModify && (
            <div className="flex gap-1.5 mt-2">
              {canComplete && (
                <Button size="sm" variant="outline" onClick={handleComplete}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                </Button>
              )}
              {completed && (
                <Button size="sm" variant="outline" onClick={() => { setEditingObs(true); setObsText('') }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Marcar pendente
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditingObs(true); setObsText(task.observation ?? '') }}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                {task.observation ? 'Editar observação' : 'Adicionar observação'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setForecastOpen(true)}>
                <CalendarClock className="h-3.5 w-3.5" />
                {forecast ? 'Editar previsão' : 'Previsão de conclusão'}
              </Button>
            </div>
          )
        )}
      </div>
      <ForecastDialog task={task} open={forecastOpen} onOpenChange={setForecastOpen} />
    </div>
  )
}