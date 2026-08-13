import { useEffect, useMemo, useState } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAgendaStore } from '@/stores/agendaStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CalendarClock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function toMin(t: string | null | undefined): number | null {
  if (!t) return null
  const parts = t.split(':').map(Number)
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
  return parts[0] * 60 + parts[1]
}

function fmtTime(t: string) {
  return t.slice(0, 5)
}

interface Props {
  open: boolean
  userId: string
  onSelect: (date: string, time: string) => void
  onSkip: () => void
  onClose: () => void
}

export function RoutineSlotPicker({ open, userId, onSelect, onSkip, onClose }: Props) {
  const { routineSlots, fetchRoutineSlots, tasks } = useAgendaStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && userId) {
      setLoading(true)
      fetchRoutineSlots(userId).finally(() => setLoading(false))
    }
  }, [open, userId, fetchRoutineSlots])

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 0 }), [])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const slots = useMemo(() => routineSlots.filter((s) => s.user_id === userId), [routineSlots, userId])

  const occurrences = useMemo(() => {
    const out: { date: Date; dateKey: string; slot: (typeof slots)[number] }[] = []
    for (const d of weekDays) {
      const weekday = d.getDay()
      const dateKey = format(d, 'yyyy-MM-dd')
      for (const s of slots) {
        if (s.weekday === weekday) out.push({ date: d, dateKey, slot: s })
      }
    }
    return out.sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1))
  }, [weekDays, slots])

  const occupiedKeys = useMemo(() => {
    const set = new Set<string>()
    for (const t of tasks) {
      if (t.assigned_to !== userId || t.deleted_at) continue
      const m = toMin(t.time)
      if (m === null) continue
      for (const s of slots) {
        if (m >= toMin(s.start_time)! && m < toMin(s.end_time)!) {
          set.add(`${t.date}|${s.id}`)
        }
      }
    }
    return set
  }, [tasks, userId, slots])

  const free = occurrences.filter((o) => !occupiedKeys.has(`${o.dateKey}|${o.slot.id}`))

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-brand-blue" />
            Escolher horário na rotina
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Carregando rotina...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Este usuário não possui blocos de rotina configurados.
            </p>
          ) : free.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Todos os horários da rotina desta semana já estão ocupados por tarefas.
            </p>
          ) : (
            free.map((o) => (
              <button
                key={`${o.dateKey}|${o.slot.id}`}
                type="button"
                onClick={() => onSelect(o.dateKey, o.slot.start_time)}
                className="flex w-full items-center gap-2 rounded-lg border border-input px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue font-medium shrink-0">
                  {WEEKDAYS[o.date.getDay()]}
                </span>
                <span className="text-xs font-medium shrink-0">{format(o.date, 'dd/MM', { locale: ptBR })}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {fmtTime(o.slot.start_time)}–{fmtTime(o.slot.end_time)}
                </span>
                <span className="truncate text-xs text-muted-foreground">{o.slot.title ?? 'Rotina'}</span>
                <Check className={cn('ml-auto h-4 w-4 shrink-0 text-brand-green')} />
              </button>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onSkip}>Sem horário fixo</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
