// Página de Rotina: grade semanal de horários fixos, onde é possível marcar
// cumprimento de blocos, arrastar tarefas entre dias/horários e configurar a própria rotina.
import { useEffect, useMemo, useState } from 'react'
import { format, startOfWeek, addDays } from 'date-fns' // Cálculos de semana.
import { ptBR } from 'date-fns/locale' // Locale em português.
import { useAgendaStore } from '@/stores/agendaStore' // Dados e ações.
import { useAuthStore } from '@/stores/authStore' // Usuário logado.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarClock, CheckCircle2, ChevronDown, ChevronUp, Circle, Copy, LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react' // Ícones.
import { motion } from 'framer-motion' // Animação.
import { cn } from '@/lib/utils'
import { WEEKDAYS } from '@/lib/constants' // Abreviações dos dias.
import { toMin, fmtTime } from '@/lib/taskUtils' // Conversão/formatação de horários.
import type { RoutineSlot, Task } from '@/types'

// Cores usadas para diferenciar os blocos de rotina na grade.
const SLOT_COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

// Retorna a cor de um slot com base no índice (cicla pela paleta).
function getSlotColor(index: number) {
  return SLOT_COLORS[index % SLOT_COLORS.length]
}

export function Rotina() {
  // Ações e dados do store global.
  const {
    weekTasks: tasks,
    users,
    routineSlots,
    routineCompletions,
    fetchUsers,
    fetchRoutineSlots,
    fetchRoutineCompletions,
    fetchTasksBetween,
    updateTask,
    toggleRoutineCompletion,
    copyRoutineSlots,
  } = useAgendaStore()
  const authUser = useAuthStore((s) => s.user) // Usuário logado.
  const [now, setNow] = useState(() => new Date()) // Data/hora atual (atualizada automaticamente).
  const [activeUserId, setActiveUserId] = useState<string | null>(null) // Usuário cuja rotina é exibida.
  const [configOpen, setConfigOpen] = useState(false) // Indica se o diálogo de configuração está aberto.
  const [configEditId, setConfigEditId] = useState<string | null>(null) // Slot a ser editado ao abrir o diálogo de configuração.
  const [dragTaskId, setDragTaskId] = useState<string | null>(null) // Tarefa sendo arrastada.
  const [mirrorSource, setMirrorSource] = useState<number | null>(null) // Dia (0-6) cuja rotina será espelhada.

  // Atualiza a data/hora a cada minuto para manter a semana vigente automaticamente.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Carrega usuários e dados de rotina ao montar.
  useEffect(() => {
    fetchUsers()
    fetchRoutineSlots()
    fetchRoutineCompletions()
  }, [fetchUsers, fetchRoutineSlots, fetchRoutineCompletions])

  const activeUserId_ = activeUserId ?? authUser?.id ?? '' // Usuário ativo efetivo.
  // Carrega rotina e conclusões do usuário ativo.
  useEffect(() => {
    if (activeUserId_) {
      fetchRoutineSlots(activeUserId_)
      fetchRoutineCompletions(activeUserId_)
    }
  }, [activeUserId_, fetchRoutineSlots, fetchRoutineCompletions])

  // Semana vigente exibida (de domingo a sábado), derivada da data atual.
  const weekStart = startOfWeek(now, { weekStartsOn: 0 })
  const weekEnd = addDays(weekStart, 6)
  const from = format(weekStart, 'yyyy-MM-dd')
  const to = format(weekEnd, 'yyyy-MM-dd')

  // Busca as tarefas da semana.
  useEffect(() => {
    fetchTasksBetween(from, to)
  }, [from, to, fetchTasksBetween])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) // Os 7 dias da semana.
  const activeUser = users.find((u) => u.id === activeUserId_) // Usuário ativo (para título).

  // Slots de rotina apenas do usuário ativo.
  const mySlots = useMemo(
    () => routineSlots.filter((s) => s.user_id === activeUserId_),
    [routineSlots, activeUserId_],
  )

  // Agrupa os slots por dia da semana (ordenados por horário de início).
  const slotsByWeekday = useMemo(() => {
    const map = new Map<number, RoutineSlot[]>()
    for (const s of mySlots) {
      const arr = map.get(s.weekday) ?? []
      arr.push(s)
      arr.sort((a, b) => toMin(a.start_time)! - toMin(b.start_time)!)
      map.set(s.weekday, arr)
    }
    return map
  }, [mySlots])

  // Agrupa as tarefas da semana por data (apenas do usuário ativo, sem soft delete).
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.deleted_at && t.assigned_to === activeUserId_) {
        const arr = map.get(t.date) ?? []
        arr.push(t)
        map.set(t.date, arr)
      }
    }
    return map
  }, [tasks, activeUserId_])

  // Conjunto de chaves "slotId|data" das conclusões do usuário ativo.
  const completionKeys = useMemo(
    () => new Set(routineCompletions.filter((c) => c.user_id === activeUserId_).map((c) => `${c.slot_id}|${c.date}`)),
    [routineCompletions, activeUserId_],
  )

  const isMyTab = authUser?.id === activeUserId_ // Indica se o usuário está vendo a própria rotina.

  // Descobre em qual slot uma tarefa se encaixa, pela hora dela, dentro do intervalo
// do slot (início incluso, fim exclusivo: m >= start && m < end).
  const slotForTask = (task: Task, slots: RoutineSlot[]) => {
    const m = toMin(task.time)
    if (m === null) return null
    return slots.find((s) => m >= toMin(s.start_time)! && m < toMin(s.end_time)!) ?? null
  }

  // Move a tarefa arrastada para a data (e opcionalmente horário) do alvo.
  const handleDrop = async (e: React.DragEvent, dateKey: string, time?: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain') // ID da tarefa arrastada.
    if (!taskId) return
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    // Se já está no mesmo lugar, não faz nada.
    if (task.date === dateKey && (time ? task.time === time : true)) {
      setDragTaskId(null)
      return
    }
    await updateTask(taskId, { date: dateKey, time: time ?? task.time })
    setDragTaskId(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Cabeçalho com o período da semana e botão de configuração (só na própria aba). */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rotina</h1>
          <p className="text-muted-foreground capitalize">
            {format(weekStart, 'dd/MM')} a {format(weekEnd, 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
        {isMyTab && (
          <Button onClick={() => setConfigOpen(true)}>
            <Plus className="h-4 w-4" /> Configurar rotina
          </Button>
        )}
      </div>

      {/* Filtro por usuário cuja rotina é exibida. */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Seletor de usuário cuja rotina é exibida. */}
        {users.map((u) => {
          const active = activeUserId_ === u.id
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => setActiveUserId(u.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                active
                  ? 'border-brand-green bg-brand-green/10 text-brand-green'
                  : 'border-input hover:bg-accent',
              )}
            >
              {u.name ?? u.email}
            </button>
          )
        })}
      </div>

      {/* Grade semanal da rotina. */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-brand-blue" />
            Rotina da semana — {activeUser?.name ?? activeUser?.email ?? '—'}
            {!isMyTab && <span className="text-xs font-normal text-muted-foreground">(somente visualização)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Grid de 7 colunas (dias). Primeira linha: cabeçalho dos dias. */}
          <div className="grid grid-cols-7 gap-px rounded-xl border bg-muted overflow-hidden">
            {weekDays.map((d) => (
              <div
                key={d.toISOString()}
                className={cn(
                  'bg-muted p-2 text-center text-xs font-medium text-muted-foreground',
                  format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
                    'bg-brand-blue-soft text-brand-blue',
                )}
              >
                {WEEKDAYS[d.getDay()]} · {format(d, 'dd')}
              </div>
            ))}
            {/* Linhas de conteúdo por dia. */}
            {weekDays.map((d) => {
              const dateKey = format(d, 'yyyy-MM-dd')
              const isToday = dateKey === format(new Date(), 'yyyy-MM-dd')
              const slots = slotsByWeekday.get(d.getDay()) ?? [] // Slots deste dia.
              const dayTasks = tasksByDate.get(dateKey) ?? [] // Tarefas deste dia.
              const hasRoutine = slots.length > 0
              const unmapped = dayTasks.filter((t) => !slotForTask(t, slots)) // Tarefas sem slot correspondente.
              return (
                <div
                  key={dateKey}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, dateKey)} // Soltar tarefa no dia (sem hora fixa).
                  className={cn(
                    'min-h-[140px] p-1.5 bg-background transition-all hover:bg-accent/40',
                    isToday &&
                      'ring-2 ring-brand-blue-soft ring-inset shadow-lg shadow-brand-blue-soft/60',
                  )}
                >
                  {hasRoutine ? (
                    // Lista os blocos de rotina do dia.
                    <div className="space-y-1.5">
                      {/* Botão de espelhar a rotina do dia para outros dias (só na própria aba). */}
                      {isMyTab && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            title="Espelhar esta rotina para outros dias"
                            onClick={() => setMirrorSource(d.getDay())}
                            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      {slots.map((s, i) => {
                        const done = completionKeys.has(`${s.id}|${dateKey}`) // Bloco cumprido?
                        const slotTasks = dayTasks.filter((t) => slotForTask(t, slots)?.id === s.id) // Tarefas deste slot.
                        return (
                          <div
                            key={s.id}
                            className="rounded-lg border-l-4 bg-muted/30 p-1.5"
                            style={{ borderLeftColor: getSlotColor(i) }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, dateKey, s.start_time)} // Soltar tarefa no horário do slot.
                          >
                            <div className="flex items-center gap-1">
                              {/* Botão de marcar/desmarcar cumprimento (só na própria aba). */}
                              {isMyTab && (
                                <button
                                  type="button"
                                  title={done ? 'Marcar como não cumprido' : 'Marcar como cumprido'}
                                  onClick={() => toggleRoutineCompletion(s.id, activeUserId_, dateKey)}
                                  className="shrink-0"
                                >
                                  {done ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
                                  ) : (
                                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </button>
                              )}
                              {/* Intervalo e título do slot (clique abre a edição do bloco, só na própria aba). */}
                              <button
                                type="button"
                                onClick={() => {
                                  setConfigEditId(s.id)
                                  setConfigOpen(true)
                                }}
                                disabled={!isMyTab}
                                title={isMyTab ? 'Editar este bloco' : undefined}
                                className={cn(
                                  'min-w-0 flex-1 text-[10px] font-medium text-muted-foreground truncate text-left',
                                  isMyTab && 'cursor-pointer transition-colors hover:text-brand-green',
                                )}
                              >
                                {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                                {s.title ? ` · ${s.title}` : ''}
                              </button>
                            </div>
                            {/* Tarefas encaixadas neste slot (arrastáveis). */}
                            <div className="mt-1 space-y-1">
                              {slotTasks.map((t) => (
                                <div
                                  key={t.id}
                                  draggable
                                  onDragStart={(e) => {
                                    setDragTaskId(t.id)
                                    e.dataTransfer.setData('text/plain', t.id)
                                    e.dataTransfer.effectAllowed = 'move'
                                  }}
                                  onDragEnd={() => setDragTaskId(null)}
                                  className={cn(
                                    'cursor-grab rounded bg-card px-1.5 py-1 text-[11px] leading-tight border-l-2 shadow-sm',
                                    dragTaskId === t.id && 'opacity-40',
                                  )}
                                  style={{ borderLeftColor: t.category?.color ?? '#888' }}
                                >
                                  <span className="font-medium">{fmtTime(t.time!)} </span>
                                  {t.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Sem rotina</p>
                  )}

                  {/* Tarefas do dia sem horário correspondente a nenhum slot. */}
                  {unmapped.length > 0 && (
                    <div className="mt-1.5 rounded border border-dashed border-border p-1.5">
                      <p className="text-[10px] text-muted-foreground">Sem horário</p>
                      <div className="mt-1 space-y-1">
                        {unmapped.map((t) => (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e) => {
                              setDragTaskId(t.id)
                              e.dataTransfer.setData('text/plain', t.id)
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            onDragEnd={() => setDragTaskId(null)}
                            className={cn(
                              'cursor-grab rounded bg-card px-1.5 py-1 text-[11px] leading-tight border-l-2 shadow-sm',
                              dragTaskId === t.id && 'opacity-40',
                            )}
                            style={{ borderLeftColor: t.category?.color ?? '#888' }}
                          >
                            {t.time && <span className="font-medium">{fmtTime(t.time)} </span>}
                            {t.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de configuração da rotina (apenas na própria aba). */}
      {isMyTab && (
        <RoutineConfigDialog
          open={configOpen}
          initialEditId={configEditId}
          onOpenChange={(v) => {
            setConfigOpen(v)
            if (!v) setConfigEditId(null)
          }}
        />
      )}

      {/* Diálogo de espelhamento: copia os blocos do dia de origem para os dias selecionados. */}
      {isMyTab && mirrorSource !== null && (
        <MirrorDayDialog
          sourceWeekday={mirrorSource}
          onOpenChange={(v) => {
            if (!v) setMirrorSource(null)
          }}
          onConfirm={async (toWeekdays) => {
            await copyRoutineSlots(mirrorSource, toWeekdays, activeUserId_)
            setMirrorSource(null)
          }}
        />
      )}
    </motion.div>
  )
}

// Diálogo para gerenciar os blocos fixos de rotina do usuário (criar, editar e excluir).
function RoutineConfigDialog({
  open,
  initialEditId,
  onOpenChange,
}: {
  open: boolean
  initialEditId?: string | null
  onOpenChange: (v: boolean) => void
}) {
  const { routineSlots, createRoutineSlot, updateRoutineSlot, deleteRoutineSlot } = useAgendaStore()
  const user = useAuthStore((s) => s.user)
  // Campos do formulário.
  const [weekday, setWeekday] = useState('1') // Dia da semana (0-6).
  const [startTime, setStartTime] = useState('08:00') // Início.
  const [endTime, setEndTime] = useState('09:00') // Fim.
  const [title, setTitle] = useState('') // Título opcional.
  const [editingId, setEditingId] = useState<string | null>(null) // Slot em edição.
  const [showSlots, setShowSlots] = useState(true) // Indica se a lista de blocos está expandida.

  // Blocos do usuário logado, ordenados por dia e horário.
  const mySlots = routineSlots
    .filter((s) => s.user_id === user?.id)
    .sort((a, b) => a.weekday - b.weekday || toMin(a.start_time)! - toMin(b.start_time)!)

  // Limpa o formulário.
  const reset = () => {
    setWeekday('1')
    setStartTime('08:00')
    setEndTime('09:00')
    setTitle('')
    setEditingId(null)
  }

  // Salva o bloco (cria ou edita).
  const handleSubmit = async () => {
    if (!user) return
    // Valida que o fim vem depois do início.
    if (toMin(endTime)! <= toMin(startTime)!) {
      alert('Horário final deve ser após o início.')
      return
    }
    if (editingId) {
      await updateRoutineSlot(editingId, {
        weekday: Number(weekday),
        start_time: startTime,
        end_time: endTime,
        title: title.trim() || null,
      })
    } else {
      await createRoutineSlot({
        user_id: user.id,
        created_by: user.id,
        weekday: Number(weekday),
        start_time: startTime,
        end_time: endTime,
        title: title.trim() || null,
      })
    }
    reset() // Limpa após salvar.
  }

  // Preenche o formulário com os dados do slot para edição.
  const startEdit = (s: RoutineSlot) => {
    setEditingId(s.id)
    setWeekday(String(s.weekday))
    // Usa apenas "HH:MM" dos horários salvos (a API guarda com segundos).
    setStartTime(s.start_time.slice(0, 5))
    setEndTime(s.end_time.slice(0, 5))
    setTitle(s.title ?? '')
  }

  // Ao abrir com um slot indicado (clique no bloco da grade), inicia a edição dele.
  useEffect(() => {
    if (!open || !initialEditId) return
    const slot = routineSlots.find((s) => s.id === initialEditId && s.user_id === user?.id)
    if (slot) startEdit(slot)
    // Só deve rodar quando o diálogo abre com um id novo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialEditId])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onOpenChange(false); reset() } }}> {/* Ao fechar, limpa o formulário. */}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-brand-blue" />
            Minha rotina semanal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Formulário do bloco: dia, título, início e fim. */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Dia da semana</Label>
              <Select value={weekday} onValueChange={setWeekday}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((name, i) => (
                    <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Título (opcional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Atendimento" />
            </div>
            <div className="space-y-1">
              <Label>Início</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Fim</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          {/* Botões: cancelar edição ou salvar/adicionar. */}
          <div className="flex justify-end gap-2">
            {editingId && (
              <Button variant="outline" onClick={reset}>Cancelar edição</Button>
            )}
            <Button onClick={handleSubmit}>{editingId ? 'Salvar alterações' : 'Adicionar bloco'}</Button>
          </div>

          {/* Cabeçalho da lista de blocos, com botão de expandir/recolher. */}
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-sm font-medium">
              Blocos configurados ({mySlots.length})
            </p>
            {mySlots.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowSlots((v) => !v)}>
                {showSlots ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showSlots ? 'Recolher' : 'Expandir'}
              </Button>
            )}
          </div>

          {/* Lista dos blocos já configurados, com editar/excluir. */}
          <div className="max-h-[40vh] space-y-1.5 overflow-y-auto pr-1">
            {mySlots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">Nenhum bloco de rotina configurado.</p>
            ) : showSlots ? (
              mySlots.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg border-l-4 bg-muted/30 px-3 py-2"
                  style={{ borderLeftColor: getSlotColor(i) }}
                >
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      title="Editar este bloco"
                      className="block w-full text-left text-sm font-medium truncate transition-colors hover:text-brand-green cursor-pointer"
                    >
                      {WEEKDAYS[s.weekday]} · {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                      {s.title ? ` · ${s.title}` : ''}
                    </button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRoutineSlot(s.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              ))
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Diálogo para espelhar os blocos de rotina de um dia para outros dias da semana.
function MirrorDayDialog({
  sourceWeekday,
  onOpenChange,
  onConfirm,
}: {
  sourceWeekday: number
  onOpenChange: (v: boolean) => void
  onConfirm: (toWeekdays: number[]) => void
}) {
  const [selected, setSelected] = useState<number[]>([]) // Dias de destino selecionados.

  // Alterna um dia na lista de selecionados.
  const toggle = (i: number) => {
    setSelected((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]))
  }

  // Confirma o espelhamento com os dias selecionados.
  const confirm = () => {
    if (selected.length === 0) return
    onConfirm(selected)
    setSelected([])
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) {
          onOpenChange(false)
          setSelected([])
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-brand-blue" />
            Espelhar rotina de {WEEKDAYS[sourceWeekday]}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Selecione os dias que receberão os blocos de {WEEKDAYS[sourceWeekday]}. Dias que já possuem os mesmos
            horários não serão duplicados.
          </p>
          {/* Seleção dos dias de destino. */}
          <div className="grid grid-cols-2 gap-2">
            {WEEKDAYS.map((name, i) => {
              const isSource = i === sourceWeekday // Dia de origem (não selecionável).
              const active = selected.includes(i)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isSource}
                  onClick={() => toggle(i)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm transition-colors',
                    isSource && 'cursor-not-allowed opacity-40',
                    !isSource && active && 'border-brand-green bg-brand-green/10 text-brand-green',
                    !isSource && !active && 'border-input hover:bg-accent',
                  )}
                >
                  {name}
                  {isSource && ' (origem)'}
                </button>
              )
            })}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setSelected([])
              }}
            >
              Cancelar
            </Button>
            <Button disabled={selected.length === 0} onClick={confirm}>
              <Copy className="h-4 w-4" /> Espelhar ({selected.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
