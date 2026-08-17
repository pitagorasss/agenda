// Página de Usuários: lista os perfis cadastrados na aplicação.
import { useEffect } from 'react'
import { useAgendaStore } from '@/stores/agendaStore' // Ação de buscar usuários.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users as UsersIcon } from 'lucide-react' // Ícone.
import { motion } from 'framer-motion' // Animação.

export function Users() {
  const { users: profiles, fetchUsers } = useAgendaStore()

  // Carrega a lista de usuários ao montar.
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">Usuários cadastrados</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-brand-blue" />
            Usuários ({profiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum usuário encontrado.</p>
          ) : (
            <div className="divide-y">
              {/* Lista os perfis com animação escalonada. */}
              {profiles.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  className="flex items-center justify-between py-2.5 gap-3"
                >
                  <div className="min-w-0">
                    {/* Nome (ou e-mail se não houver nome) e dados de identificação. */}
                    <p className="text-sm font-medium truncate">{p.name ?? p.email}</p>
                    {p.name && <p className="text-xs text-muted-foreground">{p.email}</p>}
                    <p className="text-xs text-muted-foreground">ID: {p.id.slice(0, 8)}...</p> {/* Exibe apenas o início do ID (UUID). */}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}