import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAgendaStore } from '@/stores/agendaStore'
import { TaskForm } from './TaskForm'
import { TaskCard } from '@/components/agenda/TaskCard'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  date: Date
  onClose: () => void
}

export function DayTasksModal({ date, onClose }: Props) {
  const { tasks, deleteTask, fetchUsers } = useAgendaStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const dateKey = format(date, 'yyyy-MM-dd')
  const dayTasks = tasks.filter((t) => t.date === dateKey)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (id: string) => {
    await deleteTask(id)
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

              {dayTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <TaskCard
                    task={task}
                    showResponsible
                    onEdit={() => setEditingTask(task.id)}
                    onDelete={() => handleDelete(task.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <Button className="w-full" variant="outline" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4" /> Adicionar Tarefa
            </Button>

            {showAddForm && (
              <Dialog open onOpenChange={(v) => { if (!v) setShowAddForm(false) }}>
                <DialogContent className="max-w-[522px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Tarefa</DialogTitle>
                  </DialogHeader>
                  <TaskForm
                    date={dateKey}
                    editingId={null}
                    onDone={() => setShowAddForm(false)}
                  />
                </DialogContent>
              </Dialog>
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