import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
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
    const { data } = await supabase.from('task_categories').select('*').order('name')
    if (data) set({ categories: data })
  },

  findOrCreateCategory: async (name, color) => {
    const existing = await supabase
      .from('task_categories')
      .select('id')
      .ilike('name', name.trim())
      .maybeSingle()
    if (existing.data) return existing.data.id
    const { data } = await supabase
      .from('task_categories')
      .insert({ name: name.trim(), color })
      .select('id')
      .single()
    if (data) {
      set((s) => ({ categories: [...s.categories, { id: data.id, name: name.trim(), color, created_by: '', created_at: '' }] }))
      return data.id
    }
    return null
  },

  createCategory: async (data) => {
    const { data: result, error } = await supabase.from('task_categories').insert(data).select().single()
    if (!error && result) {
      set((s) => ({ categories: [...s.categories, result] }))
      return result
    }
    return null
  },

  updateCategory: async (id, data) => {
    await supabase.from('task_categories').update(data).eq('id', id)
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }))
  },

  deleteCategory: async (id) => {
    await supabase.from('task_categories').delete().eq('id', id)
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
  },

  fetchTasks: async (date) => {
    set({ loading: true })
    let query = supabase.from('tasks').select('*, category:task_categories(*)').order('time')
    if (date) query = query.eq('date', date)
    const { data } = await query
    if (data) set({ tasks: data })
    set({ loading: false })
  },

  fetchTasksByMonth: async (year, month) => {
    set({ loading: true })
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(year, month, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('tasks')
      .select('*, category:task_categories(*)')
      .gte('date', start)
      .lte('date', end)
      .order('date')
      .order('time')
    if (data) set({ tasks: data })
    set({ loading: false })
  },

  createTask: async (data) => {
    const { data: result, error } = await supabase
      .from('tasks')
      .insert(data)
      .select('*, category:task_categories(*)')
      .single()
    if (!error && result) {
      set((s) => ({ tasks: [...s.tasks, result] }))
      return result
    }
    return null
  },

  updateTask: async (id, data) => {
    await supabase.from('tasks').update(data).eq('id', id)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }))
  },

  deleteTask: async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  fetchUsers: async () => {
    const { data } = await supabase.from('profiles').select('id, email')
    if (data) set({ users: data })
    else {
      const { data: authData } = await supabase.auth.admin.listUsers()
      if (authData?.users) {
        set({ users: authData.users.map((u) => ({ id: u.id, email: u.email ?? '' })) })
      }
    }
  },
}))
