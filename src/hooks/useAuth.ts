// Hook de autenticação: sincroniza o usuário do Supabase com o store global.
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase' // Cliente do Supabase.
import { useAuthStore } from '@/stores/authStore' // Store de autenticação.

export function useAuth() {
  // Lê o usuário e o estado de carregamento do store.
  const { user, loading, setUser, setLoading, initDark } = useAuthStore()

  useEffect(() => {
    initDark() // Aplica o tema salvo (claro/escuro) na primeira renderização.

    // Busca a sessão atual do Supabase ao montar o hook e define o usuário.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false) // Sessão carregada.
    })

    // Fica ouvindo mudanças no estado de autenticação (login/logout/token).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // Cancela a assinatura ao desmontar para evitar vazamentos.
    return () => subscription.unsubscribe()
  }, [initDark, setLoading, setUser])

  // Expõe apenas o usuário e o loading para os componentes.
  return { user, loading }
}
