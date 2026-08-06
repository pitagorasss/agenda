import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAgendaStore } from '@/stores/agendaStore'
import { DayTasksModal } from './DayTasksModal'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

export function CalendarView() {
  const { fetchTasksByMonth, tasks } = useAgendaStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchTasksByMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)
  }, [currentDate, fetchTasksByMonth])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const getTasksForDay = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd')
    return tasks.filter((t) => t.date === key)
  }

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <motion.h2
            key={format(currentDate, 'yyyy-MM')}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-semibold capitalize"
          >
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </motion.h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
          Hoje
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-xl border bg-muted overflow-hidden">
        {dayNames.map((name) => (
          <div key={name} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
            {name}
          </div>
        ))}
        {days.map((d, idx) => {
          const dayTasks = getTasksForDay(d)
          const isCurrentMonth = isSameMonth(d, currentDate)
          return (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.003, duration: 0.15 }}
              onClick={() => setSelectedDate(d)}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
              className={`relative min-h-[90px] p-1.5 text-left transition-colors bg-background hover:bg-accent focus:z-10 ${
                !isCurrentMonth ? 'opacity-40' : ''
              } ${isToday(d) ? 'ring-2 ring-brand-green ring-inset' : ''}`}
            >
              <span className={`text-xs font-medium ${isToday(d) ? 'text-brand-green' : ''}`}>
                {format(d, 'd')}
              </span>
              <div className="mt-1 space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-1 text-[10px] rounded px-1 py-0.5 truncate"
                    style={{ backgroundColor: (task.category?.color ?? '#888') + '20', color: task.category?.color ?? '#888' }}
                  >
                    {task.time && <span className="font-medium">{task.time.slice(0, 5)}</span>}
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1">+{dayTasks.length - 3} mais</span>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {selectedDate && (
        <DayTasksModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
