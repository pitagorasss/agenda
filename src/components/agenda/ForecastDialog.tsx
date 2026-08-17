// Diálogo para definir a previsão de conclusão (adiamento) de uma tarefa:
// nova data prevista, horário e observação.
import { useState } from 'react'
import type { Task } from '@/types'
import { useAgendaStore } from '@/stores/agendaStore' // Ação markTaskForecast.
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CalendarClock } from 'lucide-react' // Ícone.

// Props do diálogo.
interface Props {
  task: Task // Tarefa que receberá a previsão.
  open: boolean // Se está aberto.
  onOpenChange: (open: boolean) => void // Controla o estado aberto/fechado.
}

export function ForecastDialog({ task, open, onOpenChange }: Props) {
  const { markTaskForecast } = useAgendaStore()
  // Campos do formulário, inicializados com a previsão existente (ou data da tarefa).
  const [forecastDate, setForecastDate] = useState(task.forecast_date ?? task.date ?? '')
  const [forecastTime, setForecastTime] = useState(task.forecast_time ?? '')
  const [forecastObservation, setForecastObservation] = useState(task.forecast_observation ?? '')
  const [saving, setSaving] = useState(false) // Indicador de salvamento.

  // Salva a previsão no banco.
  const handleSubmit = async () => {
    if (!forecastDate) return // Data obrigatória.
    setSaving(true)
    const ok = await markTaskForecast(task.id, {
      forecast_date: forecastDate,
      forecast_time: forecastTime || null,
      forecast_observation: forecastObservation.trim() || null,
    })
    setSaving(false)
    if (ok) onOpenChange(false) // Fecha ao salvar com sucesso.
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-brand-blue" />
            Previsão de Conclusão
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Data e horário previstos. */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Dia previsto</Label>
              <Input type="date" value={forecastDate} onChange={(e) => setForecastDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Horário previsto</Label>
              <Input type="time" value={forecastTime} onChange={(e) => setForecastTime(e.target.value)} />
            </div>
          </div>
          {/* Observação da previsão. */}
          <div className="space-y-1">
            <Label>Observação</Label>
            <Textarea
              value={forecastObservation}
              onChange={(e) => setForecastObservation(e.target.value)}
              placeholder="Detalhes da previsão (opcional)"
              autoGrow
            />
          </div>
          {/* Botões de ação. */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !forecastDate}>
              {saving ? 'Salvando...' : 'Salvar previsão'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
