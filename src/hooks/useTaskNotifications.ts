// Hook responsável pelas notificações de tarefas: dispara lembretes no horário
// das tarefas do dia e avisa quando uma tarefa atribuída é concluída por outro usuário.
import { useCallback, useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns' // Utilitários de data.
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore' // Usuário logado.
import { useAgendaStore } from '@/stores/agendaStore' // Lista de usuários (para nome do autor).
import { playNotificationSound, preloadNotificationSound, playCompletionNotificationSound } from '@/lib/notificationSound'
import { fireBrowserNotification } from '@/lib/notifications'
import { TASK_SELECT } from '@/lib/constants'
import type { AppNotification, Task } from '@/types'

// Nome do canal de comunicação entre abas do navegador.
const CHANNEL_NAME = 'agenda-task-notifications'
// Prefixo das chaves no sessionStorage que marcam tarefas já notificadas na sessão.
const SESSION_PREFIX = 'agenda:notified:'
// Prefixo das chaves de "reivindicação" (claim) para evitar notificação duplicada entre abas.
const CLAIM_PREFIX = 'agenda:claim:'
// Tempo de vida de um claim (24h) antes de poder ser reutilizado.
const CLAIM_TTL_MS = 86_400_000

// Estrutura que guarda o timeout de um lembrete pendente.
interface Reminder {
  taskId: string
  timeout: ReturnType<typeof setTimeout>
}

// Lê um valor do localStorage com segurança (pode falhar em modo privado).
function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null // localStorage indisponível (modo privado): trata como ausente.
  }
}

// Grava um valor no localStorage com segurança.
function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* Erro ignorado: localStorage indisponível (modo privado). */
  }
}

// Reivindica a notificação de forma exclusiva entre abas.
// Retorna true apenas para a aba vencedora (garantia de som único).
async function claimOnce(taskId: string, date: string): Promise<boolean> {
  const claimKey = `${CLAIM_PREFIX}${taskId}:${date}`
  const lockName = `agenda-notify-${taskId}-${date}`

  // Verifica se esta tarefa/data já foi reivindicada recentemente.
  const claim = () => {
    const seen = storageGet(claimKey)
    if (seen && Date.now() - Number(seen) < CLAIM_TTL_MS) return false // Claim ainda válido (já notificado recentemente).
    storageSet(claimKey, String(Date.now()))
    return true // Consegue reivindicar.
  }

  // Usa a Web Locks API (se disponível) para garantir exclusividade entre abas.
  // "ifAvailable: true" não espera na fila: se o lock estiver ocupado, retorna null e outra aba notifica.
  if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks?.request) {
    try {
      const held = await navigator.locks.request(lockName, { ifAvailable: true }, () => claim())
      return held === true
    } catch {
      return claim() // Fallback sem locks.
    }
  }
  return claim()
}

// Remove claims antigos para evitar acúmulo.
function gcClaims() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CLAIM_PREFIX)) {
        const ts = Number(localStorage.getItem(key))
        if (Number.isFinite(ts) && Date.now() - ts > CLAIM_TTL_MS) localStorage.removeItem(key)
      }
    }
  } catch {
    /* Erro ignorado: localStorage indisponível (modo privado). */
  }
}

export function useTaskNotifications() {
  const user = useAuthStore((s) => s.user) // Usuário logado.
  const [todayTasks, setTodayTasks] = useState<Task[]>([]) // Tarefas de hoje do usuário.

  const remindersRef = useRef<Reminder[]>([]) // Timeouts ativos dos lembretes.
  const channelRef = useRef<BroadcastChannel | null>(null) // Canal entre abas.
  const notifiedTasksRef = useRef<Set<string>>(new Set()) // Tarefas já notificadas nesta sessão.

  // Carrega as tarefas já notificadas do sessionStorage (para esta aba).
  const loadNotified = useCallback(() => {
    notifiedTasksRef.current.clear()
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith(SESSION_PREFIX)) notifiedTasksRef.current.add(key)
      }
    } catch {
      /* Erro ignorado: sessionStorage indisponível (modo privado). */
    }
  }, [])

  // Marca uma tarefa/data como já notificada (memória + sessionStorage).
  const markNotified = useCallback((taskId: string, date: string) => {
    const key = `${SESSION_PREFIX}${taskId}:${date}`
    notifiedTasksRef.current.add(key)
    try {
      sessionStorage.setItem(key, '1')
    } catch {
      /* Erro ignorado: sessionStorage indisponível (modo privado). */
    }
  }, [])

  // Cancela todos os timeouts de lembrete pendentes.
  const clearReminders = useCallback(() => {
    remindersRef.current.forEach((r) => clearTimeout(r.timeout))
    remindersRef.current = []
  }, [])

  // Busca as tarefas de hoje atribuídas ao usuário que ainda não foram concluídas.
  const fetchToday = useCallback(async () => {
    if (!user) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .eq('assigned_to', user.id) // Só as do usuário.
      .eq('date', today) // Só as de hoje.
      .is('deleted_at', null)
      .neq('status', 'completed') // Não concluídas.
    if (!error && data) setTodayTasks(data)
  }, [user])

  // Configura o canal BroadcastChannel para sincronizar notificações entre abas.
  useEffect(() => {
    if (!user) {
      clearReminders()
      return
    }

    gcClaims() // Limpa claims antigos.

    preloadNotificationSound() // Pré-carrega o som do lembrete.

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channelRef.current = channel

      // Se outra aba notificou, marca aqui também (evita notificar 2x).
      channel.onmessage = (ev: MessageEvent) => {
        const data = ev.data
        if (data?.type === 'notified' && data.taskId && data.date) {
          markNotified(data.taskId, data.date)
        }
      }
    }

    // Limpeza ao desmontar.
    return () => {
      channelRef.current?.close()
      channelRef.current = null
      clearReminders()
    }
  }, [user, clearReminders, markNotified])

  // Solicita permissão de notificação automaticamente se ainda não decidida.
  useEffect(() => {
    if (!user) return
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [user])

  // Mantém a lista de tarefas de hoje atualizada (a cada 60s).
  useEffect(() => {
    if (!user) return
    fetchToday()
    const interval = setInterval(fetchToday, 60_000)
    return () => clearInterval(interval)
  }, [user, fetchToday])

  // Escuta em tempo real (realtime) inserções na tabela "notifications"
  // destinadas a este usuário (coluna user_id) e mostra um banner + som de conclusão.
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as AppNotification
          if (!n?.id) return
          // Descobre o nome do autor (quem concluiu) pela lista de usuários.
          const actor = useAgendaStore.getState().users.find((u) => u.id === n.actor_id)
          const actorName = actor?.name || 'Um usuário'
          const body = `${actorName} concluiu a tarefa "${n.title}"`

          fireBrowserNotification({
            title: 'Tarefa concluída',
            body,
            tag: `agenda-notif-${n.id}`,
            onShow: () => playCompletionNotificationSound(), // Toca o som de conclusão.
          })
        },
      )
      .subscribe()

    // Remove o canal ao desmontar.
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Agenda lembretes no horário de cada tarefa de hoje que ainda não foi notificada.
  useEffect(() => {
    if (!user) return
    loadNotified() // Recarrega as já notificadas.

    const todayKey = format(new Date(), 'yyyy-MM-dd')
    const now = new Date()

    clearReminders() // Limpa lembretes anteriores para recriar.

    for (const task of todayTasks) {
      if (!task.time) continue // Sem hora definida: sem lembrete.
      if (task.date !== todayKey) continue // Apenas tarefas de hoje.

      // Monta a data/hora exata do lembrete a partir da data e hora da tarefa.
      let reminderAt: Date | null = null
      try {
        reminderAt = parseISO(`${task.date}T${task.time}`)
      } catch {
        reminderAt = null
      }
      if (!reminderAt || isNaN(reminderAt.getTime())) continue

      const diff = reminderAt.getTime() - now.getTime() // Tempo até disparar.
      if (diff < 0) continue // Horário já passou.

      // Cria o timeout que disparará a notificação na hora certa.
      const timeout = setTimeout(async () => {
        const sessionKey = `${SESSION_PREFIX}${task.id}:${todayKey}`
        if (notifiedTasksRef.current.has(sessionKey)) return // Já notificado.

        const shouldPlay = await claimOnce(task.id, todayKey) // Garante som único entre abas.
        if (!shouldPlay) return

        // Avisa as outras abas para não notificarem de novo.
        channelRef.current?.postMessage({ type: 'notified', taskId: task.id, date: todayKey })

        fireBrowserNotification({
          title: `Hora da atividade: ${task.title}`,
          body: task.description || (task.time ? `Agendada para ${task.time.slice(0, 5)}` : undefined),
          tag: `agenda-task-${task.id}-${todayKey}`,
          onShow: () => playNotificationSound(), // Toca o som de lembrete.
        })

        markNotified(task.id, todayKey) // Registra como notificado.
      }, diff)

      remindersRef.current.push({ taskId: task.id, timeout })
    }

    return () => clearReminders()
  }, [todayTasks, user, clearReminders, markNotified, loadNotified])

  // Este hook não renderiza nada.
  return null
}