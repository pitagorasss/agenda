import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { TaskCategory, Task } from '@/types'

interface AgendaState {
  categories: TaskCategory[]
  tasks: Task[]
  loading: boolean
  users: { id: string; email: string }[]
  fetchCategories: () => Promise<void>
  findOrCreateCategory: (name: string, color: string) => Promise<string | null>
  createCategory: (data: Partial<TaskCategory>) => Promise<TaskCategory | null>
  updateCategory: (id: string, data: Partial<TaskCategory>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  fetchTasks: (date?: string) => Promise<void>
  fetchTasksByMonth: (year: number, month: number) => Promise<void>
  createTask: (data: Partial<Task>) => Promise<Task | null>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  fetchUsers: () => Promise<void>
}

export const useAgendaStore = create<AgendaState>((set) => ({
  categories: [],
  tasks: [],
  users: [],
  loading: false,

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
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
  },

  fetchTasks: async (date) => {
    set({ loading: true })
    let query = supabase.from('tasks').select('*, category:task_categories(*)').order('time')
    if (date) query = query.eq('date', date)
    const { data, error } = await query
    if (!error && data) set({ tasks: data })
    set({ loading: false })
  },

  fetchTasksByMonth: async (year, month) => {
    set({ loading: true })
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(year, month, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:task_categories(*)')
      .gte('date', start)
      .lte('date', end)
      .order('date')
      .order('time')
    if (!error && data) set({ tasks: data })
    set({ loading: false })
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
    const { error } = await supabase.from('tasks').update(data).eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }))
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  fetchUsers: async () => {
    const { data, error } = await supabase.from('profiles').select('id, email')
    if (!error && data) {
      set({ users: data })
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
      if (authError) {
        toast.error(authError.message)
        return
      }
      if (authData?.users) {
        set({ users: authData.users.map((u) => ({ id: u.id, email: u.email ?? '' })) })
      }
    }
  },
}))