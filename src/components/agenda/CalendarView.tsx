// Componente de calendário mensal compartilhado.
// - Exibe um mês inteiro com navegação por setas e botão "Hoje".
// - Cada dia mostra até 3 tarefas (mini-cards) e abre o DayTasksModal ao clicar.
// - Layout fixo: preenche toda a altura disponível sem rolar a página.

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAgendaStore } from '@/stores/agendaStore'
import { DayTasksModal } from './DayTasksModal'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { WEEKDAYS } from '@/lib/constants'

export function CalendarView() {
  // Busca as tarefas do mês corrente e guarda no array "tasks" do store
  const { fetchTasksByMonth, tasks } = useAgendaStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Sempre que o mês exibido muda, busca as tarefas daquele mês
  useEffect(() => {
    fetchTasksByMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)
  }, [currentDate, fetchTasksByMonth])

  // Calcula o intervalo exibido: início da semana do 1º dia até o fim da semana do último dia
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  // Gera a lista de 42 dias (6 semanas) exibidos no grid
  const days: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  // Filtra as tarefas de um dia específico pela chave ISO (yyyy-MM-dd)
  const getTasksForDay = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd')
    return tasks.filter((t) => t.date === key)
  }

  return (
    // Contêiner flex que ocupa toda a altura e não transborda (fixo, sem scroll)
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Barra de ferramentas: navegação entre meses e botão "Hoje" */}
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
      </div>

      {/*
        Grid do mês:
        - 7 colunas (dias da semana)
        - 1ª linha fixa com os nomes dos dias; as 6 linhas restantes dividem a altura restante
        - h-full + min-h-0 garante que o grid se ajuste à tela sem criar scroll
      */}
      <div className="grid h-full min-h-0 grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-px rounded-xl border bg-muted overflow-hidden">
        {WEEKDAYS.map((name) => (
          <div key={name} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
            {name}
          </div>
        ))}
        {days.map((d, idx) => {
          const dayTasks = getTasksForDay(d)
          // Dias fora do mês corrente: anterior em vermelho claro, próximo em verde claro
          const isPastMonth = d < monthStart
          const isNextMonth = d > monthEnd
          return (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.003, duration: 0.15 }}
              onClick={() => setSelectedDate(d)}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
              // min-h-0 + overflow-hidden impede que o conteúdo estoure a célula
              className={`relative min-h-0 overflow-hidden p-1.5 text-left transition-colors hover:bg-accent focus:z-10 ${
                isPastMonth
                  ? 'bg-red-500/10 text-red-400/80'
                  : isNextMonth
                    ? 'bg-green-500/10 text-green-600/80'
                    : 'bg-background'
              } ${isToday(d) ? 'ring-2 ring-brand-blue ring-inset' : ''}`}
            >
              <span className={`text-xs font-medium ${isToday(d) ? 'text-brand-blue' : ''}`}>
                {format(d, 'd')}
              </span>
              {/* Mini-cards das tarefas do dia (máx. 3 + contador) */}
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

      {/* Modal de detalhes do dia selecionado */}
      {selectedDate && (
        <DayTasksModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}