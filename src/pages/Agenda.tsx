// Página da Agenda: calendário compartilhado de tarefas.
// Layout fixo (sem scroll): o cabeçalho fica no topo e o calendário
// preenche o restante da altura disponível.

import { useEffect } from 'react'
import { useAgendaStore } from '@/stores/agendaStore'
import { CalendarView } from '@/components/agenda/CalendarView'
import { CategoryManager } from '@/components/agenda/CategoryManager'
import { motion } from 'framer-motion'

export function Agenda() {
  // Carrega as categorias ao abrir a página (usadas nos mini-cards do calendário e no popup de categorias)
  const { fetchCategories } = useAgendaStore()

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return (
    // h-full + min-h-0 + overflow-hidden: a página ocupa a tela e não rola
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full min-h-0 flex-col gap-4 overflow-hidden"
    >
      {/* Cabeçalho fixo: título + botão "Ver categorias" (popup) */}
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Calendário compartilhado de tarefas</p>
        </div>
        <CategoryManager />
      </div>

      {/* Área do calendário: flex-1 + min-h-0 preenche a altura restante sem transbordar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="min-h-0 flex-1"
      >
        <CalendarView />
      </motion.div>
    </motion.div>
  )
}