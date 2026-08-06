import { useEffect, useState } from 'react'
import { useContractStore } from '@/stores/contractStore'
import { useAgendaStore } from '@/stores/agendaStore'
import { TaskCard } from '@/components/agenda/TaskCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, AlertTriangle, Calendar, FileText, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export function Dashboard() {
  const { contracts, fetchContracts } = useContractStore()
  const { tasks, fetchTasks } = useAgendaStore()
  const navigate = useNavigate()
  const [showAlertPopup, setShowAlertPopup] = useState(true)

  useEffect(() => {
    fetchContracts()
    fetchTasks(format(new Date(), 'yyyy-MM-dd'))
  }, [])

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const todayTasks = tasks.filter((t) => t.date === todayKey)
  const todayFormatted = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  const alerts = contracts.filter((c) => {
    if (c.status !== 'active') return false
    const diff = differenceInDays(new Date(c.next_due_date), new Date())
    return diff >= 0 && diff <= 30
  })

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  }

  return (
    <>
      {/* Alert Popup Dialog */}
      <Dialog open={showAlertPopup && alerts.length > 0} onOpenChange={setShowAlertPopup}>
        <DialogContent className="max-w-md border-red-400 shadow-2xl shadow-red-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xl">
              <AlertTriangle className="h-6 w-6 animate-blink" />
              Alertas de Vencimento
            </DialogTitle>
            <DialogDescription className="text-red-600/70 dark:text-red-400/70">
              {alerts.length} {alerts.length === 1 ? 'contrato esta' : 'contratos estao'} proximos do vencimento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {alerts.map((contract) => {
              const diff = differenceInDays(new Date(contract.next_due_date), new Date())
              return (
                <motion.button
                  key={contract.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => { navigate('/contracts'); setShowAlertPopup(false) }}
                  className="w-full text-left rounded-xl border-2 border-red-500 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/60 dark:to-orange-950/40 p-4 shadow-lg shadow-red-500/20 animate-blink"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-500 mt-0.5 shrink-0 animate-pulse" />
                    <div className="flex-1">
                      <p className="font-bold text-red-700 dark:text-red-300 text-base">
                        "{contract.name}" — vence em {diff} {diff === 1 ? 'dia' : 'dias'}
                      </p>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80 flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(contract.next_due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAlertPopup(false)} className="w-full">
              Fechar Alertas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

        {alerts.length > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              <span>Alertas de Contrato</span>
              <span className="text-xs font-normal text-muted-foreground">({alerts.length})</span>
            </div>
            {alerts.map((contract) => {
              const diff = differenceInDays(new Date(contract.next_due_date), new Date())
              return (
                <motion.button
                  key={contract.id}
                  variants={item}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate('/contracts')}
                  className="w-full text-left rounded-xl border-2 border-red-400 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/30 p-4 transition-colors hover:from-red-100 hover:to-orange-100 dark:hover:from-red-950/70 dark:hover:to-orange-950/50 shadow-md shadow-red-500/10"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0 animate-pulse" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-700 dark:text-red-300">
                        Contrato "{contract.name}" vence em {diff} {diff === 1 ? 'dia' : 'dias'}
                      </p>
                      <p className="text-sm text-red-600/70 dark:text-red-400/70 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        Proximo vencimento: {format(new Date(contract.next_due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      <p className="text-xs text-red-500/60 mt-1 flex items-center gap-1">
                        Clique para ver detalhes <ArrowRight className="h-3 w-3" />
                      </p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        )}

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
                  {todayTasks.map((task, idx) => (
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
            <Button onClick={() => navigate('/contracts')}>
              <Plus className="h-4 w-4" /> Novo Contrato
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button variant="secondary" onClick={() => navigate('/agenda')}>
              <Plus className="h-4 w-4" /> Nova Tarefa
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button variant="outline" onClick={() => navigate('/users')}>
              Usuarios
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  )
}