import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAgendaStore } from '@/stores/agendaStore'
import { useAuthStore } from '@/stores/authStore'
import { TaskForm } from './TaskForm'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil, Trash2, Plus, User, CheckCircle2, MessageSquarePlus, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  date: Date
  onClose: () => void
}

const OBS_MAX = 500

export function DayTasksModal({ date, onClose }: Props) {
  const { tasks, deleteTask, markTaskCompleted, markTaskPending, updateTask, users, fetchUsers } = useAgendaStore()
  const user = useAuthStore((s) => s.user)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [obsTaskId, setObsTaskId] = useState<string | null>(null)
  const [obsText, setObsText] = useState('')
  const dateKey = format(date, 'yyyy-MM-dd')
  const dayTasks = tasks.filter((t) => t.date === dateKey)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const getUserName = (id: string) => users.find((u) => u.id === id)?.email ?? 'Usuário'
  const currentUserRole = users.find((u) => u.id === user?.id)?.role ?? 'user'

  const canModify = (taskId: string) => {
    const t = tasks.find((tk) => tk.id === taskId)
    if (!t) return false
    return t?.created_by === user?.id || t?.assigned_to === user?.id || currentUserRole === 'admin'
  }

  const canComplete = (taskId: string) => {
    const t = tasks.find((tk) => tk.id === taskId)
    if (!t) return false
    return (t?.assigned_to === user?.id || t?.created_by === user?.id || currentUserRole === 'admin') && t.status !== 'completed'
  }

  const handleDelete = async (id: string) => {
    await deleteTask(id)
  }

  const handleComplete = async (id: string) => {
    const ok = await markTaskCompleted(id, obsText)
    if (ok) {
      setObsTaskId(null)
      setObsText('')
    }
  }

  const handlePending = async (id: string) => {
    const ok = await markTaskPending(id, obsText)
    if (ok) {
      setObsTaskId(null)
      setObsText('')
    }
  }

  const handleSaveObservation = async (id: string) => {
    await updateTask(id, { observation: obsText.trim() || null })
    setObsTaskId(null)
    setObsText('')
  }

  return (
    <>
      <Dialog open={true} onOpenChange={(v) => { if (!v) onClose() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {dayTasks.length === 0 && !showAddForm && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground text-center py-4"
                >
                  Nenhuma tarefa neste dia.
                </motion.p>
              )}

              {dayTasks.map((task, idx) => {
                const completed = task.status === 'completed'
                const editingThis = obsTaskId === task.id
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                    className={`flex items-start gap-3 rounded-xl border p-3 hover:shadow-md transition-all duration-200 ${completed ? 'bg-muted/40' : ''}`}
                    style={{ borderLeftColor: task.category?.color ?? '#888', borderLeftWidth: 3 }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {completed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500 text-white font-medium shrink-0">
                            Concluída
                          </span>
                        )}
                        {task.time && (
                          <span className="text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {task.time.slice(0, 5)}
                          </span>
                        )}
                        <span className={`text-sm font-medium ${completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                        {task.category && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: task.category.color + '20', color: task.category.color }}
                          >
                            {task.category.name}
                          </span>
                        )}
                      </div>
                      {task.assigned_to && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <User className="h-3 w-3" /> {getUserName(task.assigned_to)}
                        </p>
                      )}
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
                      {canModify(task.id) && !editingThis && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => { setObsTaskId(task.id); setObsText(task.observation ?? '') }}
                        >
                          <MessageSquarePlus className="h-3.5 w-3.5" />
                          {task.observation ? 'Editar observação' : 'Adicionar observação'}
                        </Button>
                      )}
                      {editingThis && (
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
                            <Button size="sm" variant="outline" onClick={() => { setObsTaskId(null); setObsText('') }}>
                              Cancelar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSaveObservation(task.id)}>
                              Salvar
                            </Button>
                            {completed && canModify(task.id) && (
                              <Button size="sm" variant="secondary" onClick={() => handlePending(task.id)}>
                                <RotateCcw className="h-3.5 w-3.5" /> Marcar pendente
                              </Button>
                            )}
                            {canComplete(task.id) && (
                              <Button size="sm" onClick={() => handleComplete(task.id)}>
                                Concluir
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {canComplete(task.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Concluir / observação"
                          onClick={() => { setObsTaskId(task.id); setObsText(task.observation ?? '') }}
                        >
                          <CheckCircle2 className={`h-3 w-3 ${completed ? 'text-muted-foreground' : 'text-brand-green'}`} />
                        </Button>
                      )}
                      {completed && canModify(task.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Marcar como pendente"
                          onClick={() => { setObsTaskId(task.id); setObsText(task.observation ?? '') }}
                        >
                          <RotateCcw className="h-3 w-3 text-amber-500" />
                        </Button>
                      )}
                      {canModify(task.id) && (
                        <>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTask(task.id)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(task.id)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {showAddForm ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <TaskForm
                  date={dateKey}
                  editingId={null}
                  onDone={() => setShowAddForm(false)}
                />
              </motion.div>
            ) : (
              <Button className="w-full" variant="outline" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4" /> Adicionar Tarefa
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editingTask && (
        <Dialog open onOpenChange={(v) => { if (!v) setEditingTask(null) }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Tarefa</DialogTitle>
            </DialogHeader>
            <TaskForm
              date={dateKey}
              editingId={editingTask}
              onDone={() => setEditingTask(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}