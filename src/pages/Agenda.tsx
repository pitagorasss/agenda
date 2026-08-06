import { useEffect } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { CalendarView } from '@/components/agenda/CalendarView'
import { CategoryManager } from '@/components/agenda/CategoryManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

export function Agenda() {
  const { fetchCategories } = useAgendaStore()

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Agenda</h1>
        <p className="text-muted-foreground">Calendário compartilhado de tarefas</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <CalendarView />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryManager />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
