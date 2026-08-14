import { useEffect, useState } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { PieChart as PieChartIcon, TrendingUp, CheckCircle2, Clock, Target } from 'lucide-react'
import { PerformanceCard } from '@/components/agenda/PerformanceCard'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100)
}

export function Statistics() {
  const { tasks, fetchReportedTasks, fetchUsers, users, loading } = useAgendaStore()
  const user = useAuthStore((s) => s.user)

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [userId, setUserId] = useState(user?.id ?? '')

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchReportedTasks({ userId: userId && userId !== 'all' ? userId : undefined })
  }, [fetchReportedTasks, userId])

  const applyFilters = () => {
    fetchReportedTasks({
      from: from || undefined,
      to: to || undefined,
      userId: userId && userId !== 'all' ? userId : undefined,
    })
  }

  const resetFilters = () => {
    setFrom('')
    setTo('')
    setUserId(user?.id ?? '')
    fetchReportedTasks({ userId: user?.id ?? undefined })
  }

  const completed = tasks.filter((t) => t.status === 'completed')
  const pending = tasks.filter((t) => t.status === 'pending')
  const forecast = tasks.filter((t) => t.status === 'forecast')
  const total = tasks.length
  const completionRate = pct(completed.length, total)

  const trendData = (() => {
    const map = new Map<string, { date: string; label: string; concluidas: number; total: number }>()
    const sorted = [...tasks].sort((a, b) => (a.date < b.date ? -1 : 1))

    const useMonth = sorted.length > 90 || (from && to && diffDays(from, to) > 60)
    for (const t of sorted) {
      const key = useMonth ? t.date.slice(0, 7) : t.date
      if (!map.has(key)) {
        const d = new Date(t.date)
        map.set(key, {
          date: key,
          label: useMonth ? format(d, 'MMM/yy', { locale: ptBR }) : format(d, 'dd/MM', { locale: ptBR }),
          concluidas: 0,
          total: 0,
        })
      }
      const item = map.get(key)!
      item.total++
      if (t.status === 'completed') item.concluidas++
    }
    return Array.from(map.values())
  })()

  const kpis = [
    { label: 'Total no período', value: total, icon: Target, color: 'text-brand-blue' },
    { label: 'Concluídas', value: completed.length, icon: CheckCircle2, color: 'text-brand-green' },
    {
      label: 'Pendentes + Previstas',
      value: pending.length + forecast.length,
      icon: Clock,
      color: 'text-amber-500',
    },
    { label: 'Taxa de conclusão', value: `${completionRate}%`, icon: TrendingUp, color: 'text-brand-green' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Estatística</h1>
        <p className="text-muted-foreground">Acompanhamento da conclusão de tarefas</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-brand-blue" />
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
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters}>Filtrar</Button>
              <Button variant="outline" onClick={resetFilters}>Limpar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.25 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  {kpi.label}
                </div>
                <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <PerformanceCard tasks={tasks} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tendência de conclusão</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : trendData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem tarefas no período.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="Total" stroke="#2563EB" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="concluidas" name="Concluídas" stroke="#16A34A" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function diffDays(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}