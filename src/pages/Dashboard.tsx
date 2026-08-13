import { useEffect, useState } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { useAuthStore } from '@/stores/authStore'
import { TaskCard } from '@/components/agenda/TaskCard'
import { PerformanceCard } from '@/components/agenda/PerformanceCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Users as UsersIcon, AlertTriangle, ListFilter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'pending' | 'forecast' | 'completed'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'forecast', label: 'Previstas' },
  { value: 'completed', label: 'Concluídas' },
]

export function Dashboard() {
  const { tasks, overdueTasks, fetchUserTasks, fetchUsers, users, loading } = useAgendaStore()
  const user = useAuthStore((s) => s.user)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const effectiveUserId = selectedUserId ?? user?.id ?? ''

  useEffect(() => {
    if (effectiveUserId) fetchUserTasks(effectiveUserId)
  }, [effectiveUserId, fetchUserTasks])

  const todayKey = format(new Date(), 'yyyy-MM-dd')

  const overdueIds = new Set(overdueTasks.map((t) => t.id))
  const showOverdue = statusFilter === 'all' || statusFilter === 'pending'
  const filteredTasks = tasks
    .filter((t) => !t.deleted_at)
    .filter((t) => (statusFilter === 'all' ? true : t.status === statusFilter))
    .filter((t) => (statusFilter === 'all' || statusFilter === 'pending' ? t.date >= todayKey : true))
    .filter((t) => !showOverdue || !overdueIds.has(t.id))

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

      <div className="flex flex-wrap items-center gap-2">
        <UsersIcon className="h-4 w-4 text-brand-blue" />
        {users.map((u) => {
          const active = effectiveUserId === u.id
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedUserId(u.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                active
                  ? 'border-brand-green bg-brand-green/10 text-brand-green'
                  : 'border-input hover:bg-accent',
              )}
            >
              {u.name ?? u.email}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-b py-2.5">
        <ListFilter className="h-4 w-4 text-brand-blue" />
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                active
                  ? 'border-brand-green bg-brand-green/10 text-brand-green'
                  : 'border-input hover:bg-accent',
              )}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {showOverdue && overdueTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Card className="border-amber-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Pendentes de dias anteriores
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({overdueTasks.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {overdueTasks.map((task) => (
                      <motion.div key={task.id} variants={item} layout exit={{ opacity: 0, x: -20 }}>
                        <TaskCard task={task} showDate />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <PerformanceCard tasks={tasks} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-blue" />
              Tarefas de hoje
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({filteredTasks.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : filteredTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa para exibir.</p>
            ) : (
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task) => (
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
    </motion.div>
  )
}