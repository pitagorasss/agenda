// Diálogo que sugere horários livres da rotina do responsável para a semana
// da tarefa, permitindo escolher um horário ou ignorar (sem horário fixo).
import { useEffect, useMemo, useState } from 'react'
import { format, addDays, startOfWeek, parseISO } from 'date-fns' // Cálculos de semana.
import { ptBR } from 'date-fns/locale' // Locale em português.
import { supabase } from '@/lib/supabase' // Para verificar tarefas ocupadas na semana.
import { useAgendaStore } from '@/stores/agendaStore' // Slots de rotina.
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CalendarClock, Check } from 'lucide-react' // Ícones.
import { cn } from '@/lib/utils'
import { WEEKDAYS } from '@/lib/constants' // Abreviações dos dias da semana.
import { toMin, fmtTime } from '@/lib/taskUtils' // Conversão/formatação de horários.

// Props do seletor.
interface Props {
  open: boolean // Se o diálogo está aberto.
  userId: string // Responsável (para buscar a rotina dele).
  date?: string // Data da tarefa — define a semana dos horários exibidos.
  onSelect: (date: string, time: string) => void // Ao escolher um horário.
  onSkip: () => void // Ao optar por "sem horário fixo".
  onClose: () => void // Ao fechar o diálogo.
}

export function RoutineSlotPicker({ open, userId, date, onSelect, onSkip, onClose }: Props) {
  const { routineSlots, fetchRoutineSlots } = useAgendaStore()
  const [loading, setLoading] = useState(false) // Carregando rotina/tarefas.
  const [occupiedKeys, setOccupiedKeys] = useState<Set<string>>(new Set()) // Horários já ocupados.

  // Define o início da semana (domingo) a partir da data da tarefa (ou de hoje).
  const weekStart = useMemo(
    () => (date ? startOfWeek(parseISO(date), { weekStartsOn: 0 }) : startOfWeek(new Date(), { weekStartsOn: 0 })),
    [date],
  )
  // Gera os 7 dias da semana.
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  // Ao abrir, carrega a rotina do usuário e as tarefas já existentes na semana
  // para marcar quais horários já estão ocupados.
  useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    Promise.all([
      fetchRoutineSlots(userId), // Busca os slots de rotina do usuário.
      supabase
        .from('tasks') // Tabela "tasks": busca tarefas da semana do responsável.
        .select('id, date, time, status, deleted_at')
        .eq('assigned_to', userId) // Só tarefas do responsável.
        .gte('date', format(weekStart, 'yyyy-MM-dd')) // Início da semana.
        .lte('date', format(addDays(weekStart, 6), 'yyyy-MM-dd')), // Fim da semana.
    ])
      .then(([, { data: userTasks }]) => {
        // Cria as chaves "data|minuto" das tarefas que ocupam horário.
        // Ignora apagadas (soft delete), concluídas e sem horário — elas não ocupam vaga.
        setOccupiedKeys(
          new Set(
            (userTasks ?? [])
              .filter((t) => !t.deleted_at && t.status !== 'completed' && toMin(t.time) !== null)
              .map((t) => `${t.date}|${toMin(t.time)}`),
          ),
        )
      })
      .finally(() => setLoading(false))
  }, [open, userId, weekStart, fetchRoutineSlots])

  // Slots de rotina apenas do responsável selecionado.
  const slots = useMemo(() => routineSlots.filter((s) => s.user_id === userId), [routineSlots, userId])

  // Gera as "ocorrências": combina cada dia da semana com os slots cujo weekday coincide.
  const occurrences = useMemo(() => {
    const out: { date: Date; dateKey: string; slot: (typeof slots)[number] }[] = []
    for (const d of weekDays) {
      const weekday = d.getDay()
      const dateKey = format(d, 'yyyy-MM-dd')
      for (const s of slots) {
        if (s.weekday === weekday) out.push({ date: d, dateKey, slot: s })
      }
    }
    return out.sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1)) // Ordena por data.
  }, [weekDays, slots])

  // Filtra apenas as ocorrências livres (sem conflito com tarefas existentes no horário).
  const free = occurrences.filter((o) => {
    for (const key of occupiedKeys) {
      const [occDate, occMin] = key.split('|')
      if (occDate !== o.dateKey) continue
      const m = Number(occMin)
      // Se a tarefa está dentro do intervalo do slot, o horário está ocupado.
      if (m >= toMin(o.slot.start_time)! && m < toMin(o.slot.end_time)!) return false
    }
    return true
  })

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
            // Lista os horários livres como botões clicáveis.
            free.map((o) => (
              <button
                key={`${o.dateKey}|${o.slot.id}`}
                type="button"
                onClick={() => onSelect(o.dateKey, o.slot.start_time)} // Preenche o formulário com a data/hora escolhidas.
                className="flex w-full items-center gap-2 rounded-lg border border-input px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue font-medium shrink-0">
                  {WEEKDAYS[o.date.getDay()]} {/* Dia da semana. */}
                </span>
                <span className="text-xs font-medium shrink-0">{format(o.date, 'dd/MM', { locale: ptBR })}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {fmtTime(o.slot.start_time)}–{fmtTime(o.slot.end_time)} {/* Intervalo do slot. */}
                </span>
                <span className="truncate text-xs text-muted-foreground">{o.slot.title ?? 'Rotina'}</span>
                <Check className={cn('ml-auto h-4 w-4 shrink-0 text-brand-green')} />
              </button>
            ))
          )}
        </div>
        {/* Botão para pular a escolha de horário. */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onSkip}>Sem horário fixo</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}