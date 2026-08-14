import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { TASK_SELECT } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import type { TaskCategory, Task, Profile, EvolutionObservation, RoutineSlot, RoutineSlotCompletion } from '@/types'

interface EvolutionFilters {
  responsibleId?: string
  type?: string
  level?: string
}

let tasksSeq = 0
let userTasksSeq = 0
let reportedTasksSeq = 0

type TaskArrays = 'tasks' | 'userTasks' | 'weekTasks' | 'reportTasks'

interface AgendaState {
  categories: TaskCategory[]
  tasks: Task[]
  userTasks: Task[]
  weekTasks: Task[]
  reportTasks: Task[]
  overdueTasks: Task[]
  evolutions: EvolutionObservation[]
  loadingCount: number
  users: Profile[]
  routineSlots: RoutineSlot[]
  routineCompletions: RoutineSlotCompletion[]
  fetchCategories: () => Promise<void>
  findOrCreateCategory: (name: string, color: string) => Promise<string | null>
  createCategory: (data: Partial<TaskCategory>) => Promise<TaskCategory | null>
  updateCategory: (id: string, data: Partial<TaskCategory>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  fetchTasksByMonth: (year: number, month: number) => Promise<void>
  fetchTasksBetween: (from: string, to: string) => Promise<void>
  fetchUserTasks: (userId: string) => Promise<void>
  fetchReportedTasks: (filters: { from?: string; to?: string; userId?: string; status?: string }) => Promise<void>
  createTask: (data: Partial<Task>) => Promise<Task | null>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  markTaskCompleted: (id: string, observation?: string) => Promise<boolean>
  markTaskPending: (id: string, observation?: string) => Promise<boolean>
  markTaskForecast: (
    id: string,
    data: { forecast_date: string; forecast_time?: string | null; forecast_observation?: string | null }
  ) => Promise<boolean>
  fetchEvolutions: (filters?: EvolutionFilters) => Promise<void>
  createEvolution: (data: Partial<EvolutionObservation>) => Promise<EvolutionObservation | null>
  updateEvolution: (id: string, data: Partial<EvolutionObservation>) => Promise<boolean>
  deleteEvolution: (id: string) => Promise<boolean>
  fetchUsers: () => Promise<void>
  fetchRoutineSlots: (userId?: string) => Promise<void>
  createRoutineSlot: (data: Partial<RoutineSlot>) => Promise<RoutineSlot | null>
  updateRoutineSlot: (id: string, data: Partial<RoutineSlot>) => Promise<void>
  deleteRoutineSlot: (id: string) => Promise<void>
  fetchRoutineCompletions: (userId?: string) => Promise<void>
  toggleRoutineCompletion: (slotId: string, userId: string, date: string) => Promise<void>
}

const taskArrays: TaskArrays[] = ['tasks', 'userTasks', 'weekTasks', 'reportTasks']

const updaterFor =
  (id: string, updater: (t: Task) => Task) =>
  (prev: AgendaState): Partial<AgendaState> => {
    const next: Partial<AgendaState> = {}
    for (const key of taskArrays) {
      next[key] = prev[key].map((t) => (t.id === id ? updater(t) : t))
    }
    return next
  }

const removerFor = (id: string) => (prev: AgendaState): Partial<AgendaState> => {
  const next: Partial<AgendaState> = {}
  for (const key of taskArrays) {
    next[key] = prev[key].filter((t) => t.id !== id)
  }
  return next
}

export const useAgendaStore = create<AgendaState>((set) => ({
  categories: [],
  tasks: [],
  userTasks: [],
  weekTasks: [],
  reportTasks: [],
  overdueTasks: [],
  evolutions: [],
  users: [],
  loadingCount: 0,
  routineSlots: [],
  routineCompletions: [],

  fetchCategories: async () => {
    const { data, error } = await supabase.from('task_categories').select('*').order('name')
    if (!error && data) set({ categories: data })
  },

  findOrCreateCategory: async (name, color) => {
    const existing = await supabase
      .from('task_categories')
      .select('id')
      .ilike('name', name.trim())
      .maybeSingle()
    if (existing.data) return existing.data.id
    const { data, error } = await supabase
      .from('task_categories')
      .insert({ name: name.trim(), color })
      .select('id')
      .single()
    if (error) {
      toast.error(error.message)
      return null
    }
    if (data) {
      set((s) => ({ categories: [...s.categories, { id: data.id, name: name.trim(), color, created_by: '', created_at: '' }] }))
      return data.id
    }
    return null
  },

  createCategory: async (data) => {
    const { data: result, error } = await supabase.from('task_categories').insert(data).select().single()
    if (error) {
      toast.error(error.message)
      return null
    }
    set((s) => ({ categories: [...s.categories, result] }))
    return result
  },

  updateCategory: async (id, data) => {
    const { error } = await supabase.from('task_categories').update(data).eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }))
  },

  deleteCategory: async (id) => {
    const { error } = await supabase.from('task_categories').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => {
      const next: Partial<AgendaState> = {}
      for (const key of taskArrays) {
        next[key] = s[key].map((t) => (t.category_id === id ? { ...t, category_id: null, category: null } : t))
      }
      return {
        categories: s.categories.filter((c) => c.id !== id),
        ...next,
      }
    })
  },

  fetchTasksByMonth: async (year, month) => {
    set((s) => ({ loadingCount: s.loadingCount + 1 }))
    const seq = ++tasksSeq
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .gte('date', start)
      .lte('date', end)
      .is('deleted_at', null)
      .order('date')
      .order('time')
    if (!error && data && seq === tasksSeq) set({ tasks: data })
    set((s) => ({ loadingCount: s.loadingCount - 1 }))
  },

  fetchTasksBetween: async (from, to) => {
    set((s) => ({ loadingCount: s.loadingCount + 1 }))
    const seq = ++tasksSeq
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .gte('date', from)
      .lte('date', to)
      .is('deleted_at', null)
      .order('date')
      .order('time')
    if (!error && data && seq === tasksSeq) set({ weekTasks: data })
    set((s) => ({ loadingCount: s.loadingCount - 1 }))
  },

  fetchUserTasks: async (userId) => {
    set((s) => ({ loadingCount: s.loadingCount + 1 }))
    const seq = ++userTasksSeq
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .eq('assigned_to', userId)
      .is('deleted_at', null)
      .order('date')
      .order('time')
    if (!error && data && seq === userTasksSeq) {
      set({
        userTasks: data,
        overdueTasks: data.filter((t) => t.date < today && t.status === 'pending'),
      })
    }
    if (seq === userTasksSeq) set((s) => ({ loadingCount: s.loadingCount - 1 }))
  },

  fetchReportedTasks: async ({ from, to, userId, status }) => {
    set((s) => ({ loadingCount: s.loadingCount + 1 }))
    const seq = ++reportedTasksSeq
    let query = supabase
      .from('tasks')
      .select(TASK_SELECT)
      .is('deleted_at', null)
      .order('date')
      .order('time')
    if (userId) query = query.eq('assigned_to', userId)
    if (from) query = query.gte('date', from)
    if (to) query = query.lte('date', to)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (!error && data && seq === reportedTasksSeq) set({ reportTasks: data })
    if (seq === reportedTasksSeq) set((s) => ({ loadingCount: s.loadingCount - 1 }))
  },

  createTask: async (data) => {
    const { data: result, error } = await supabase
      .from('tasks')
      .insert(data)
      .select(TASK_SELECT)
      .single()
    if (error) {
      toast.error(error.message)
      return null
    }
    set((s) => ({ tasks: [...s.tasks, result] }))
    return result
  },

  updateTask: async (id, data) => {
    const { data: updated, error } = await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select(TASK_SELECT)
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      ...updaterFor(id, () => updated)(s),
      overdueTasks: s.overdueTasks.map((t) => (t.id === id ? updated : t)),
    }))
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      ...removerFor(id)(s),
      overdueTasks: s.overdueTasks.filter((t) => t.id !== id),
    }))
  },

  markTaskCompleted: async (id, observation) => {
    const userId = useAuthStore.getState().user?.id
    const { data: updated, error } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: userId ?? null,
        observation: observation || null,
        forecast_date: null,
        forecast_time: null,
        forecast_observation: null,
      })
      .eq('id', id)
      .select(TASK_SELECT)
      .single()
    if (error) {
      toast.error(error.message)
      return false
    }
    if (!updated) return false
    set((s) => ({
      ...updaterFor(id, () => updated)(s),
      overdueTasks: s.overdueTasks.filter((t) => t.id !== id),
    }))
    return true
  },

  markTaskPending: async (id, observation) => {
    const { data: updated, error } = await supabase
      .from('tasks')
      .update({
        status: 'pending',
        completed_at: null,
        completed_by: null,
        observation: observation || null,
        forecast_date: null,
        forecast_time: null,
        forecast_observation: null,
      })
      .eq('id', id)
      .select(TASK_SELECT)
      .single()
    if (error) {
      toast.error(error.message)
      return false
    }
    if (!updated) return false
    const today = format(new Date(), 'yyyy-MM-dd')
    const isPast = updated.date < today
    set((s) => {
      const inOverdue = s.overdueTasks.some((t) => t.id === id)
      return {
        ...updaterFor(id, () => updated)(s),
        overdueTasks: isPast
          ? inOverdue
            ? s.overdueTasks.map((t) => (t.id === id ? updated : t))
            : [...s.overdueTasks, updated]
          : s.overdueTasks.filter((t) => t.id !== id),
      }
    })
    return true
  },

  markTaskForecast: async (id, { forecast_date, forecast_time, forecast_observation }) => {
    const { data: updated, error } = await supabase
      .from('tasks')
      .update({
        status: 'forecast',
        forecast_date,
        forecast_time: forecast_time || null,
        forecast_observation: forecast_observation || null,
        completed_at: null,
        completed_by: null,
      })
      .eq('id', id)
      .select(TASK_SELECT)
      .single()
    if (error) {
      toast.error(error.message)
      return false
    }
    if (!updated) return false
    set((s) => ({
      ...updaterFor(id, () => updated)(s),
      overdueTasks: s.overdueTasks.map((t) => (t.id === id ? updated : t)),
    }))
    return true
  },

  fetchEvolutions: async ({ responsibleId, type, level } = {}) => {
    set((s) => ({ loadingCount: s.loadingCount + 1 }))
    let query = supabase.from('evolution_observations').select('*').order('created_at', { ascending: false })
    if (responsibleId) query = query.eq('responsible_id', responsibleId)
    if (type) query = query.eq('type', type)
    if (level) query = query.eq('level', level)
    const { data, error } = await query
    if (!error && data) set({ evolutions: data })
    set((s) => ({ loadingCount: s.loadingCount - 1 }))
  },

  createEvolution: async (data) => {
    const userId = useAuthStore.getState().user?.id
    const { data: result, error } = await supabase
      .from('evolution_observations')
      .insert({ ...data, created_by: userId })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return null
    }
    set((s) => ({ evolutions: [result, ...s.evolutions] }))
    return result
  },

  updateEvolution: async (id, data) => {
    const { error } = await supabase.from('evolution_observations').update(data).eq('id', id)
    if (error) {
      toast.error(error.message)
      return false
    }
    set((s) => ({
      evolutions: s.evolutions.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }))
    return true
  },

  deleteEvolution: async (id) => {
    const { error } = await supabase.from('evolution_observations').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return false
    }
    set((s) => ({ evolutions: s.evolutions.filter((e) => e.id !== id) }))
    return true
  },

  fetchUsers: async () => {
    const { data, error } = await supabase.from('profiles').select('id, email, name, created_at').order('email')
    if (!error && data) set({ users: data })
  },

  fetchRoutineSlots: async (userId) => {
    let query = supabase.from('routine_slots').select('*').order('weekday').order('start_time')
    if (userId) query = query.eq('user_id', userId)
    const { data, error } = await query
    if (!error && data) set({ routineSlots: data })
  },

  createRoutineSlot: async (data) => {
    const userId = useAuthStore.getState().user?.id
    const { data: result, error } = await supabase
      .from('routine_slots')
      .insert({ ...data, created_by: userId ?? data.created_by })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return null
    }
    set((s) => ({ routineSlots: [...s.routineSlots, result] }))
    return result
  },

  updateRoutineSlot: async (id, data) => {
    const { error } = await supabase.from('routine_slots').update(data).eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      routineSlots: s.routineSlots.map((sl) => (sl.id === id ? { ...sl, ...data } : sl)),
    }))
  },

  deleteRoutineSlot: async (id) => {
    const { error } = await supabase.from('routine_slots').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      routineSlots: s.routineSlots.filter((sl) => sl.id !== id),
      routineCompletions: s.routineCompletions.filter((c) => c.slot_id !== id),
    }))
  },

  fetchRoutineCompletions: async (userId) => {
    let query = supabase.from('routine_slot_completions').select('*').order('date')
    if (userId) query = query.eq('user_id', userId)
    const { data, error } = await query
    if (!error && data) set({ routineCompletions: data })
  },

  toggleRoutineCompletion: async (slotId, userId, date) => {
    const currentUserId = useAuthStore.getState().user?.id
    const existing = await supabase
      .from('routine_slot_completions')
      .select('id')
      .eq('slot_id', slotId)
      .eq('date', date)
      .maybeSingle()
    if (existing.data) {
      const { error } = await supabase.from('routine_slot_completions').delete().eq('id', existing.data.id)
      if (error) {
        toast.error(error.message)
        return
      }
      set((s) => ({ routineCompletions: s.routineCompletions.filter((c) => c.id !== existing.data!.id) }))
      return
    }
    const { data: created, error } = await supabase
      .from('routine_slot_completions')
      .insert({ slot_id: slotId, user_id: userId, date, created_by: currentUserId ?? null })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({ routineCompletions: [...s.routineCompletions, created] }))
  },
}))