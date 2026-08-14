import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { TaskCategory, Task, Profile, EvolutionObservation, RoutineSlot, RoutineSlotCompletion } from '@/types'

interface EvolutionFilters {
  responsibleId?: string
  type?: string
  level?: string
}

let userTasksSeq = 0
let reportedTasksSeq = 0

interface AgendaState {
  categories: TaskCategory[]
  tasks: Task[]
  overdueTasks: Task[]
  evolutions: EvolutionObservation[]
  loading: boolean
  users: Profile[]
  routineSlots: RoutineSlot[]
  routineCompletions: RoutineSlotCompletion[]
  fetchCategories: () => Promise<void>
  findOrCreateCategory: (name: string, color: string) => Promise<string | null>
  createCategory: (data: Partial<TaskCategory>) => Promise<TaskCategory | null>
  updateCategory: (id: string, data: Partial<TaskCategory>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  fetchTasks: (date?: string) => Promise<void>
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

export const useAgendaStore = create<AgendaState>((set) => ({
  categories: [],
  tasks: [],
  overdueTasks: [],
  evolutions: [],
  users: [],
  loading: false,
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
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      tasks: s.tasks.map((t) => (t.category_id === id ? { ...t, category_id: null } : t)),
    }))
  },

  fetchTasks: async (date) => {
    set({ loading: true })
    let query = supabase.from('tasks').select('*, category:task_categories(*)').is('deleted_at', null).order('time')
    if (date) query = query.eq('date', date)
    const { data, error } = await query
    if (!error && data) set({ tasks: data })
    set({ loading: false })
  },

  fetchTasksByMonth: async (year, month) => {
    set({ loading: true })
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:task_categories(*)')
      .gte('date', start)
      .lte('date', end)
      .is('deleted_at', null)
      .order('date')
      .order('time')
    if (!error && data) set({ tasks: data })
    set({ loading: false })
  },

  fetchTasksBetween: async (from, to) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:task_categories(*)')
      .gte('date', from)
      .lte('date', to)
      .is('deleted_at', null)
      .order('date')
      .order('time')
    if (!error && data) set({ tasks: data })
    set({ loading: false })
  },

  fetchUserTasks: async (userId) => {    set({ loading: true })
    const seq = ++userTasksSeq
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:task_categories(*)')
      .eq('assigned_to', userId)
      .order('date')
      .order('time')
    if (!error && data && seq === userTasksSeq) {
      set({
        tasks: data,
        overdueTasks: data.filter((t) => t.date < today && t.status === 'pending' && !t.deleted_at),
      })
    }
    if (seq === userTasksSeq) set({ loading: false })
  },

  fetchReportedTasks: async ({ from, to, userId, status }) => {
    set({ loading: true })
    const seq = ++reportedTasksSeq
    let query = supabase
      .from('tasks')
      .select('*, category:task_categories(*)')
      .order('date')
      .order('time')
    if (userId) query = query.eq('assigned_to', userId)
    if (from) query = query.gte('date', from)
    if (to) query = query.lte('date', to)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (!error && data && seq === reportedTasksSeq) set({ tasks: data })
    if (seq === reportedTasksSeq) set({ loading: false })
  },

  createTask: async (data) => {
    const { data: result, error } = await supabase
      .from('tasks')
      .insert(data)
      .select('*, category:task_categories(*)')
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
      .select('*, category:task_categories(*)')
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
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
      tasks: s.tasks.filter((t) => t.id !== id),
      overdueTasks: s.overdueTasks.filter((t) => t.id !== id),
    }))
  },

  markTaskCompleted: async (id, observation) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: user?.id ?? null,
        observation: observation || null,
        forecast_date: null,
        forecast_time: null,
        forecast_observation: null,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) {
      toast.error(error.message)
      return false
    }
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
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
      .select('*, category:task_categories(*)')
      .single()
    if (error) {
      toast.error(error.message)
      return false
    }
    const today = format(new Date(), 'yyyy-MM-dd')
    set((s) => {
      const updatedTask = updated ?? {
        ...s.tasks.find((t) => t.id === id),
        status: 'pending' as const,
        completed_at: null,
        completed_by: null,
        observation: observation || null,
        forecast_date: null,
        forecast_time: null,
        forecast_observation: null,
      }
      if (!updatedTask) return s
      const isPast = updatedTask.date < today
      return {
        tasks: s.tasks.map((t) => (t.id === id ? updatedTask : t)),
        overdueTasks: isPast
          ? (() => {
              const exists = s.overdueTasks.some((t) => t.id === id)
              return exists ? s.overdueTasks.map((t) => (t.id === id ? updatedTask : t)) : [...s.overdueTasks, updatedTask]
            })()
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
      .select('*, category:task_categories(*)')
      .single()
    if (error) {
      toast.error(error.message)
      return false
    }
    set((s) => {
      const updatedTask = updated ?? { ...s.tasks.find((t) => t.id === id), status: 'forecast' as const }
      if (!updatedTask) return s
      return {
        tasks: s.tasks.map((t) => (t.id === id ? updatedTask : t)),
        overdueTasks: s.overdueTasks.map((t) => (t.id === id ? updatedTask : t)),
      }
    })
    return true
  },

  fetchEvolutions: async ({ responsibleId, type, level } = {}) => {
    set({ loading: true })
    let query = supabase.from('evolution_observations').select('*').order('created_at', { ascending: false })
    if (responsibleId) query = query.eq('responsible_id', responsibleId)
    if (type) query = query.eq('type', type)
    if (level) query = query.eq('level', level)
    const { data, error } = await query
    if (!error && data) set({ evolutions: data })
    set({ loading: false })
  },

  createEvolution: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: result, error } = await supabase
      .from('evolution_observations')
      .insert({ ...data, created_by: user?.id })
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
    const { data: { user } } = await supabase.auth.getUser()
    const { data: result, error } = await supabase
      .from('routine_slots')
      .insert({ ...data, created_by: user?.id ?? data.created_by })
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
    const { data: { user } } = await supabase.auth.getUser()
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
      .insert({ slot_id: slotId, user_id: userId, date, created_by: user?.id ?? null })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({ routineCompletions: [...s.routineCompletions, created] }))
  },
}))