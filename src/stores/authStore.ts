import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  isDark: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  toggleDark: () => void
  initDark: () => void
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isDark: localStorage.getItem('theme') === 'dark',
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  toggleDark: () =>
    set((state) => {
      const next = !state.isDark
      localStorage.setItem('theme', next ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', next)
      return { isDark: next }
    }),
  initDark: () => {
    const isDark = localStorage.getItem('theme') === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    set({ isDark })
  },
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  },
  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
