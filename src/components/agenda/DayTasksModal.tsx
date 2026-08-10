import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAgendaStore } from '@/stores/agendaStore'
import { TaskForm } from './TaskForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil, Trash2, Plus, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  date: Date
  onClose: () => void
}

export function DayTasksModal({ date, onClose }: Props) {
  const { tasks, deleteTask, users, fetchUsers } = useAgendaStore()
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const dateKey = format(date, 'yyyy-MM-dd')
  const dayTasks = tasks.filter((t) => t.date === dateKey)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const getUserName = (id: string) => users.find((u) => u.id === id)?.email ?? 'Usuário'

  const canModify = () => true

  const handleDelete = async (id: string) => {
    await deleteTask(id)
  }

  return (
    <Dialog open={true} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {dayTasks.length === 0 && !showForm && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground text-center py-4"
              >
                Nenhuma tarefa neste dia.
              </motion.p>
            )}

            {dayTasks.map((task, idx) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.2 }}
                className="flex items-start gap-3 rounded-xl border p-3 hover:shadow-md transition-all duration-200"
                style={{ borderLeftColor: task.category?.color ?? '#888', borderLeftWidth: 3 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.time && (
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {task.time.slice(0, 5)}
                      </span>
                    )}
                    <span className="text-sm font-medium">{task.title}</span>
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
                  {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                </div>
                {canModify() && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingTask(task.id); setShowForm(true) }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(task.id)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {showForm ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <TaskForm
                date={dateKey}
                editingId={editingTask}
                onDone={() => { setShowForm(false); setEditingTask(null) }}
              />
            </motion.div>
          ) : (
            <Button className="w-full" variant="outline" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Adicionar Tarefa
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
