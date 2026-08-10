import { useEffect, useState } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { useAuthStore } from '@/stores/authStore'
import { TaskCard } from '@/components/agenda/TaskCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, FileText, Users as UsersIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const { tasks, fetchUserTasks, fetchUsers, users, loading } = useAgendaStore()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const currentRole = users.find((u) => u.id === user?.id)?.role ?? 'user'
  const isAdminOrAnalista = currentRole === 'admin' || currentRole === 'analista'

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const effectiveUserId = isAdminOrAnalista ? (selectedUserId ?? user?.id ?? '') : (user?.id ?? '')

  useEffect(() => {
    if (effectiveUserId) fetchUserTasks(effectiveUserId)
  }, [effectiveUserId, fetchUserTasks])

  const selectedUser = users.find((u) => u.id === effectiveUserId)

  const todayFormatted = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground capitalize">{todayFormatted}</p>
      </div>

      {isAdminOrAnalista ? (
        <div className="flex flex-wrap items-center gap-2">
          <UsersIcon className="h-4 w-4 text-brand-blue" />
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedUserId(u.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                selectedUserId === u.id
                  ? 'border-brand-green bg-brand-green/10 text-brand-green'
                  : 'border-input hover:bg-accent',
              )}
            >
              {u.email}
            </button>
          ))}
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-blue" />
              Tarefas de {selectedUser ? selectedUser.email : 'você'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa para exibir.</p>
            ) : (
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {tasks.map((task) => (
                    <motion.div key={task.id} variants={item} layout exit={{ opacity: 0, x: -20 }}>
                      <TaskCard task={task} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="flex flex-wrap gap-3"
      >
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button variant="secondary" onClick={() => navigate('/agenda')}>
            <Plus className="h-4 w-4" /> Nova Tarefa
          </Button>
        </motion.div>
        {currentRole === 'admin' && (
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button variant="outline" onClick={() => navigate('/users')}>
              Usuários
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}