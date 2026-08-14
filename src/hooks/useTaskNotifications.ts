import { useCallback, useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAgendaStore } from '@/stores/agendaStore'
import { playNotificationSound, preloadNotificationSound, playCompletionNotificationSound } from '@/lib/notificationSound'
import { fireBrowserNotification } from '@/lib/notifications'
import { TASK_SELECT } from '@/lib/constants'
import type { AppNotification, Task } from '@/types'

const CHANNEL_NAME = 'agenda-task-notifications'
const SESSION_PREFIX = 'agenda:notified:'
const CLAIM_PREFIX = 'agenda:claim:'
const CLAIM_TTL_MS = 86_400_000

interface Reminder {
  taskId: string
  timeout: ReturnType<typeof setTimeout>
}

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    //
  }
}

/**
 * Reivindica a notificacao de forma exclusiva entre abas.
 * Retorna true apenas para a aba vencedora (garantia de som unico).
 */
async function claimOnce(taskId: string, date: string): Promise<boolean> {
  const claimKey = `${CLAIM_PREFIX}${taskId}:${date}`
  const lockName = `agenda-notify-${taskId}-${date}`

  const claim = () => {
    const seen = storageGet(claimKey)
    if (seen && Date.now() - Number(seen) < CLAIM_TTL_MS) return false
    storageSet(claimKey, String(Date.now()))
    return true
  }

  if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks?.request) {
    try {
      const held = await navigator.locks.request(lockName, { ifAvailable: true }, () => claim())
      return held === true
    } catch {
      return claim()
    }
  }
  return claim()
}

/** Remove claims antigos para evitar acumulo. */
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
    //
  }
}

export function useTaskNotifications() {
  const user = useAuthStore((s) => s.user)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])

  const remindersRef = useRef<Reminder[]>([])
  const channelRef = useRef<BroadcastChannel | null>(null)
  const notifiedTasksRef = useRef<Set<string>>(new Set())

  const loadNotified = useCallback(() => {
    notifiedTasksRef.current.clear()
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith(SESSION_PREFIX)) notifiedTasksRef.current.add(key)
      }
    } catch {
      //
    }
  }, [])

  const markNotified = useCallback((taskId: string, date: string) => {
    const key = `${SESSION_PREFIX}${taskId}:${date}`
    notifiedTasksRef.current.add(key)
    try {
      sessionStorage.setItem(key, '1')
    } catch {
      //
    }
  }, [])

  const clearReminders = useCallback(() => {
    remindersRef.current.forEach((r) => clearTimeout(r.timeout))
    remindersRef.current = []
  }, [])

  const fetchToday = useCallback(async () => {
    if (!user) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .eq('assigned_to', user.id)
      .eq('date', today)
      .is('deleted_at', null)
      .neq('status', 'completed')
    if (!error && data) setTodayTasks(data)
  }, [user])

  useEffect(() => {
    if (!user) {
      clearReminders()
      return
    }

    gcClaims()

    preloadNotificationSound()

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channelRef.current = channel

      channel.onmessage = (ev: MessageEvent) => {
        const data = ev.data
        if (data?.type === 'notified' && data.taskId && data.date) {
          markNotified(data.taskId, data.date)
        }
      }
    }

    return () => {
      channelRef.current?.close()
      channelRef.current = null
      clearReminders()
    }
  }, [user, clearReminders, markNotified])

  useEffect(() => {
    if (!user) return
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchToday()
    const interval = setInterval(fetchToday, 60_000)
    return () => clearInterval(interval)
  }, [user, fetchToday])

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
          const actor = useAgendaStore.getState().users.find((u) => u.id === n.actor_id)
          const actorName = actor?.name || 'Um usuário'
          const body = `${actorName} concluiu a tarefa "${n.title}"`

          fireBrowserNotification({
            title: 'Tarefa concluída',
            body,
            tag: `agenda-notif-${n.id}`,
            onShow: () => playCompletionNotificationSound(),
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    loadNotified()

    const todayKey = format(new Date(), 'yyyy-MM-dd')
    const now = new Date()

    clearReminders()

    for (const task of todayTasks) {
      if (!task.time) continue
      if (task.date !== todayKey) continue

      let reminderAt: Date | null = null
      try {
        reminderAt = parseISO(`${task.date}T${task.time}`)
      } catch {
        reminderAt = null
      }
      if (!reminderAt || isNaN(reminderAt.getTime())) continue

      const diff = reminderAt.getTime() - now.getTime()
      if (diff < 0) continue

      const timeout = setTimeout(async () => {
        const sessionKey = `${SESSION_PREFIX}${task.id}:${todayKey}`
        if (notifiedTasksRef.current.has(sessionKey)) return

        const shouldPlay = await claimOnce(task.id, todayKey)
        if (!shouldPlay) return

        channelRef.current?.postMessage({ type: 'notified', taskId: task.id, date: todayKey })

        fireBrowserNotification({
          title: `Hora da atividade: ${task.title}`,
          body: task.description || (task.time ? `Agendada para ${task.time.slice(0, 5)}` : undefined),
          tag: `agenda-task-${task.id}-${todayKey}`,
          onShow: () => playNotificationSound(),
        })

        markNotified(task.id, todayKey)
      }, diff)

      remindersRef.current.push({ taskId: task.id, timeout })
    }

    return () => clearReminders()
  }, [todayTasks, user, clearReminders, markNotified, loadNotified])

  return null
}