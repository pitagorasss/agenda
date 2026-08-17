// Store de autenticação (Zustand): gerencia o usuário logado e o tema (claro/escuro).
import { create } from 'zustand' // Biblioteca de gerenciamento de estado global.
import { supabase } from '@/lib/supabase' // Cliente do Supabase (para autenticação).
import type { User } from '@supabase/supabase-js' // Tipo de usuário autenticado do Supabase.

// Estrutura do estado de autenticação.
interface AuthState {
  user: User | null // Usuário autenticado (null se deslogado).
  loading: boolean // Indica se a sessão ainda está carregando.
  isDark: boolean // Se o tema escuro está ativo.
  setUser: (user: User | null) => void // Define o usuário atual.
  setLoading: (loading: boolean) => void // Define o estado de carregamento.
  toggleDark: () => void // Alterna entre tema claro/escuro.
  initDark: () => void // Aplica o tema salvo ao carregar o app.
  signIn: (email: string, password: string) => Promise<string | null> // Login.
  signUp: (email: string, password: string) => Promise<string | null> // Cadastro.
  signOut: () => Promise<void> // Logout.
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, // Inicia sem usuário.
  loading: true, // Começa carregando a sessão.
  // Inicializa o tema escuro com base no valor salvo no localStorage.
  isDark: localStorage.getItem('theme') === 'dark',
  setUser: (user) => set({ user }), // Atualiza o usuário no estado.
  setLoading: (loading) => set({ loading }), // Atualiza o loading.
  toggleDark: () =>
    set((state) => {
      const next = !state.isDark // Inverte o tema atual.
      localStorage.setItem('theme', next ? 'dark' : 'light') // Persiste a escolha.
      document.documentElement.classList.toggle('dark', next) // Aplica a classe "dark" no <html>.
      return { isDark: next }
    }),
  initDark: () => {
    const isDark = localStorage.getItem('theme') === 'dark' // Lê o tema salvo.
    document.documentElement.classList.toggle('dark', isDark) // Aplica no <html>.
    set({ isDark })
  },
  signIn: async (email, password) => {
    // Faz login com e-mail e senha no Supabase Auth.
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null // Retorna a mensagem de erro, ou null se ok.
  },
  signUp: async (email, password) => {
    // Cria uma conta no Supabase Auth.
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  },
  signOut: async () => {
    await supabase.auth.signOut() // Encerra a sessão no Supabase.
    set({ user: null }) // Limpa o usuário do estado.
  },
}))
