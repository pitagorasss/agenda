import { useEffect } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { TaskCard } from '@/components/agenda/TaskCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

export function Dashboard() {
  const { tasks, fetchTasks } = useAgendaStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchTasks(format(new Date(), 'yyyy-MM-dd'))
  }, [fetchTasks])

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const todayTasks = tasks.filter((t) => t.date === todayKey)
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-blue" />
              Agenda de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa para hoje.</p>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {todayTasks.map((task) => (
                  <motion.div key={task.id} variants={item}>
                    <TaskCard task={task} />
                  </motion.div>
                ))}
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
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button variant="outline" onClick={() => navigate('/users')}>
            Usuários
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}