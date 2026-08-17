// Modal que exibe todas as tarefas de um dia específico, com opções de
// adicionar nova tarefa e editar/excluir as existentes.
import { useState, useEffect } from 'react'
import { format } from 'date-fns' // Formatação de data.
import { ptBR } from 'date-fns/locale' // Locale em português.
import { useAgendaStore } from '@/stores/agendaStore' // Ações de tarefas.
import { TaskForm } from './TaskForm' // Formulário de criação/edição.
import { TaskCard } from '@/components/agenda/TaskCard' // Cartão da tarefa.
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react' // Ícone.
import { motion, AnimatePresence } from 'framer-motion' // Animações.

// Props do modal.
interface Props {
  date: Date // Dia cujas tarefas serão exibidas.
  onClose: () => void // Ao fechar o modal.
}

export function DayTasksModal({ date, onClose }: Props) {
  const { tasks, deleteTask, fetchUsers } = useAgendaStore()
  const [showAddForm, setShowAddForm] = useState(false) // Se o formulário de nova tarefa está aberto.
  const [editingTask, setEditingTask] = useState<string | null>(null) // Id da tarefa em edição.
  const dateKey = format(date, 'yyyy-MM-dd') // Chave ISO do dia.
  const dayTasks = tasks.filter((t) => t.date === dateKey) // Tarefas do dia.

  // Carrega os usuários (para mostrar responsáveis) ao montar.
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Exclui a tarefa pelo id.
  const handleDelete = async (id: string) => {
    await deleteTask(id)
  }

  return (
    <>
      {/* Modal principal com a lista de tarefas do dia. */}
      <Dialog open={true} onOpenChange={(v) => { if (!v) onClose() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto overflow-x-hidden pr-1">
            <AnimatePresence mode="popLayout">
              {/* Mensagem quando não há tarefas. */}
              {dayTasks.length === 0 && !showAddForm && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground text-center py-4"
                >
                  Nenhuma tarefa neste dia.
                </motion.p>
              )}

              {/* Lista de tarefas do dia, com animação de entrada. */}
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
                    onEdit={() => setEditingTask(task.id)} // Abre edição.
                    onDelete={() => handleDelete(task.id)} // Exclui.
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Botão para adicionar nova tarefa. */}
            <Button className="w-full" variant="outline" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4" /> Adicionar Tarefa
            </Button>

            {/* Formulário de nova tarefa (sub-dialog). */}
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

      {/* Formulário de edição da tarefa (sub-dialog). */}
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