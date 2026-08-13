import { useCallback, useEffect, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { useAgendaStore } from '@/stores/agendaStore'
import { playNotificationSound, preloadNotificationSound } from '@/lib/notificationSound'
import { fireBrowserNotification } from '@/lib/notifications'

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
  const tasks = useAgendaStore((s) => s.tasks)
  const overdueTasks = useAgendaStore((s) => s.overdueTasks)
  const fetchUserTasks = useAgendaStore((s) => s.fetchUserTasks)

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
    fetchUserTasks(user.id)
  }, [user, fetchUserTasks])

  useEffect(() => {
    if (!user) return
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    loadNotified()

    const eligible = [...tasks, ...overdueTasks].filter(
      (t) => t.assigned_to === user.id && t.time && t.status !== 'completed',
    )

    const todayKey = format(new Date(), 'yyyy-MM-dd')
    const now = new Date()

    clearReminders()

    for (const task of eligible) {
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
        const stillPending = useAgendaStore
          .getState()
          .tasks.some((t) => t.id === task.id && t.status !== 'completed')
        if (!stillPending) return

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
  }, [tasks, overdueTasks, user, fetchUserTasks, clearReminders, markNotified, loadNotified])

  return null
}