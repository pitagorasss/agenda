import { useEffect, useState } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { FileBarChart, Users as UsersIcon } from 'lucide-react'

export function Reports() {
  const { tasks, fetchReportedTasks, fetchUsers, users, loading } = useAgendaStore()
  const user = useAuthStore((s) => s.user)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')
  const [userId, setUserId] = useState('')

  const currentRole = users.find((u) => u.id === user?.id)?.role ?? 'user'
  const canSeeAll = currentRole === 'admin' || currentRole === 'analista'

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchReportedTasks({})
  }, [fetchReportedTasks])

  const effectiveUserId = canSeeAll ? ((userId && userId !== 'all') ? userId : undefined) : user?.id

  const applyFilters = () => {
    fetchReportedTasks({
      from: from || undefined,
      to: to || undefined,
      status: (status && status !== 'all') ? status : undefined,
      userId: effectiveUserId,
    })
  }

  const resetFilters = () => {
    setFrom('')
    setTo('')
    setStatus('')
    setUserId('')
    fetchReportedTasks({ userId: canSeeAll ? undefined : user?.id })
  }

  const getUserName = (id: string) => users.find((u) => u.id === id)?.name ?? users.find((u) => u.id === id)?.email ?? '—'

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Relatório de Atividades</h1>
        <p className="text-muted-foreground">Tarefas concluídas e pendentes com observações</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-brand-blue" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label>De</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Até</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {canSeeAll ? (
              <div className="space-y-1">
                <Label>Usuário</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name ?? u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <UsersIcon className="h-3 w-3" /> Seu relatório
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters}>Filtrar</Button>
            <Button variant="outline" onClick={resetFilters}>Limpar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Atividades ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma atividade encontrada.</p>
          ) : (
            <div className="divide-y">
              {tasks.map((task, idx) => {
                const completed = task.status === 'completed'
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className="py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {completed ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-green text-white font-medium">Concluída</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500 text-white font-medium">Pendente</span>
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
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      <span>Data: {formatDate(task.date)}</span>
                      {task.time && <span>Hora: {task.time.slice(0, 5)}</span>}
                      {task.assigned_to && <span>Responsável: {getUserName(task.assigned_to)}</span>}
                      {completed && task.completed_at && (
                        <span>Concluída em: {format(new Date(task.completed_at), 'dd/MM/yyyy HH:mm')}</span>
                      )}
                    </div>
                    {task.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{task.description}</p>}
                    {task.observation && (
                      <p className="text-xs mt-1 whitespace-pre-wrap border-l-2 border-brand-green pl-2 text-muted-foreground">
                        <span className="font-medium text-foreground">Obs:</span> {task.observation}
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}