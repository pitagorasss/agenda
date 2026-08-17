// Página principal (Dashboard): mostra a performance e as tarefas do usuário,
// com filtros por usuário e por status, além de um bloco de tarefas atrasadas.
import { useEffect, useState } from 'react'
import { useAgendaStore } from '@/stores/agendaStore' // Store com fetchUserTasks, fetchUsers, overdueTasks, etc.
import { useAuthStore } from '@/stores/authStore' // Usuário logado.
import { TaskCard } from '@/components/agenda/TaskCard' // Cartão de tarefa.
import { PerformanceCard } from '@/components/agenda/PerformanceCard' // Cartão de performance.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns' // Formatação de data.
import { ptBR } from 'date-fns/locale' // Locale em português.
import { FileText, Users as UsersIcon, AlertTriangle, ListFilter } from 'lucide-react' // Ícones.
import { motion, AnimatePresence } from 'framer-motion' // Animações.
import { cn } from '@/lib/utils'

// Filtros de status das tarefas.
type StatusFilter = 'all' | 'pending' | 'forecast' | 'completed'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'forecast', label: 'Previstas' },
  { value: 'completed', label: 'Concluídas' },
]

export function Dashboard() {
  const { userTasks: tasks, overdueTasks, fetchUserTasks, fetchUsers, users, loadingCount } = useAgendaStore()
  const loading = loadingCount > 0 // Indica se há requisições em andamento.
  const user = useAuthStore((s) => s.user)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Carrega a lista de usuários (para os filtros).
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Usuário efetivo: o selecionado, ou o usuário logado.
  const effectiveUserId = selectedUserId ?? user?.id ?? ''

  // Busca as tarefas do usuário efetivo.
  useEffect(() => {
    if (effectiveUserId) fetchUserTasks(effectiveUserId)
  }, [effectiveUserId, fetchUserTasks])

  const todayKey = format(new Date(), 'yyyy-MM-dd') // Chave ISO de hoje.

  const overdueIds = new Set(overdueTasks.map((t) => t.id)) // IDs das tarefas atrasadas.
  const showOverdue = statusFilter === 'all' || statusFilter === 'pending' // Mostra atrasadas só nesses modos.
  // Filtra as tarefas por status, remove as de dias passados (exceto no modo pendente/geral)
  // e oculta as atrasadas quando não devem ser exibidas nesta lista.
  const filteredTasks = tasks
    .filter((t) => (statusFilter === 'all' ? true : t.status === statusFilter))
    .filter((t) => (statusFilter === 'all' || statusFilter === 'pending' ? t.date >= todayKey : true))
    .filter((t) => !showOverdue || !overdueIds.has(t.id))

  const todayFormatted = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR }) // Data de hoje legível.

  // Variantes de animação (container com filhos em sequência).
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
      {/* Cabeçalho da página. */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground capitalize">{todayFormatted}</p>
      </div>

      {/* Filtros por usuário. */}
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

      {/* Filtros por status. */}
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

      {/* Cartão de performance do usuário. */}
      <PerformanceCard tasks={tasks} />

      {/* Bloco de tarefas pendentes de dias anteriores (atrasadas). */}
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

      {/* Lista das tarefas filtradas. */}
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