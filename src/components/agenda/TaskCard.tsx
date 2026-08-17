// Cartão exibido para cada tarefa, com ações de concluir, observar, prever, editar e excluir.
import { useState } from 'react'
import type { Task } from '@/types'
import { useAgendaStore } from '@/stores/agendaStore' // Ações de tarefas.
import { useAuthStore } from '@/stores/authStore' // Usuário logado.
import { Button } from '@/components/ui/button'
import { PriorityBadge } from '@/components/agenda/PriorityBadge' // Selo de prioridade.
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, MessageSquarePlus, CalendarClock, Pencil, Trash2, User } from 'lucide-react' // Ícones.
import { format, parseISO } from 'date-fns' // Formatação de datas.
import { ForecastDialog } from '@/components/agenda/ForecastDialog' // Diálogo de previsão de conclusão.
import { getUserName } from '@/lib/taskUtils' // Nome do responsável.

// Props do cartão.
interface Props {
  task: Task // Tarefa exibida.
  showDate?: boolean // Se mostra o dia (ex.: na agenda).
  showResponsible?: boolean // Se mostra o responsável.
  onEdit?: () => void // Ação ao clicar em editar.
  onDelete?: () => void // Ação ao clicar em excluir.
}

// Limite de caracteres da observação.
const OBS_MAX = 500

export function TaskCard({ task, showDate, showResponsible, onEdit, onDelete }: Props) {
  const { markTaskCompleted, updateTask, users } = useAgendaStore()
  const user = useAuthStore((s) => s.user) // Usuário logado.
  const [editingObs, setEditingObs] = useState(false) // Se o campo de observação está aberto.
  const [obsText, setObsText] = useState(task.observation ?? '') // Texto da observação.
  const [forecastOpen, setForecastOpen] = useState(false) // Se o diálogo de previsão está aberto.

  const completed = task.status === 'completed' // Tarefa concluída.
  const forecast = task.status === 'forecast' // Tarefa com previsão.

  // Permite modificar se o usuário criou ou é o responsável pela tarefa.
  const canModify =
    task.created_by === user?.id || task.assigned_to === user?.id

  // Pode concluir se tem permissão e ainda não está concluída.
  const canComplete = canModify && !completed

  // Conclui a tarefa levando a observação digitada.
  const handleComplete = async () => {
    const ok = await markTaskCompleted(task.id, obsText)
    if (ok) {
      setEditingObs(false)
      setObsText('')
    }
  }

  // Salva apenas a observação (sem concluir); texto vazio vira null no banco.
  const handleSaveObs = async () => {
    await updateTask(task.id, { observation: obsText.trim() || null })
    setEditingObs(false)
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 border-l-4 hover:shadow-md transition-all duration-200 ${completed ? 'bg-muted/40' : ''}`}
      style={{ borderLeftColor: task.category?.color ?? '#888' }} // Borda esquerda na cor da categoria.
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selos: concluída, prevista, prioridade, data, hora. */}
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
          <PriorityBadge priority={task.priority} />
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
          {/* Título (riscado quando concluído). */}
          <span className={`text-sm font-medium truncate ${completed ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </span>
          {/* Selo da categoria com sua cor. */}
          {task.category && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
              style={{ backgroundColor: task.category.color + '20', color: task.category.color }}
            >
              {task.category.name}
            </span>
          )}
        </div>
        {/* Responsável da tarefa (opcional). */}
        {showResponsible && task.assigned_to && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <User className="h-3 w-3" /> {getUserName(task.assigned_to, users)}
          </p>
        )}
        {/* Descrição da tarefa. */}
        {task.description && (
          <p className={`text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap ${completed ? 'line-through' : ''}`}>
            {task.description}
          </p>
        )}
        {/* Observação registrada. */}
        {task.observation && (
          <p className="text-xs mt-1 whitespace-pre-wrap border-l-2 border-brand-green pl-2 text-muted-foreground">
            <span className="font-medium text-foreground">Obs:</span> {task.observation}
          </p>
        )}
        {/* Informação da previsão de conclusão (quando adiada). */}
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

        {/* Modo de edição da observação. */}
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
            <div className="flex gap-2 flex-wrap">
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
            </div>
          </div>
        ) : (
          // Ações disponíveis (apenas para quem pode modificar).
          canModify && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {canComplete && (
                <Button size="sm" variant="outline" onClick={handleComplete}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
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
              {onEdit && (
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="outline" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </Button>
              )}
            </div>
          )
        )}
      </div>
      {/* Diálogo de previsão de conclusão. */}
      <ForecastDialog task={task} open={forecastOpen} onOpenChange={setForecastOpen} />
    </div>
  )
}