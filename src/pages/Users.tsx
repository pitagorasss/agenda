import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users as UsersIcon, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Profile } from '@/types'

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  analista: 'Analista',
  user: 'Usuário Comum',
}

export function Users() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const currentUser = useAuthStore((s) => s.user)

  const isAdmin = profiles.find((p) => p.id === currentUser?.id)?.role === 'admin'

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase.from('profiles').select('id, email, name, role, created_at').order('email')
    if (data) setProfiles(data)
  }

  const handleRoleChange = async (id: string, role: 'admin' | 'analista' | 'user') => {
    setSavingId(id)
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    setSavingId(null)
    if (error) {
      alert(error.message)
      return
    }
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">Usuários cadastrados e níveis de acesso</p>
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
              {profiles.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  className="flex items-center justify-between py-2.5 gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name ?? p.email}</p>
                    {p.name && <p className="text-xs text-muted-foreground">{p.email}</p>}
                    <p className="text-xs text-muted-foreground">ID: {p.id.slice(0, 8)}...</p>
                  </div>
                  {isAdmin ? (
                    <Select value={p.role ?? 'user'} onValueChange={(v) => handleRoleChange(p.id, v as 'admin' | 'analista' | 'user')}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="analista">Analista</SelectItem>
                        <SelectItem value="user">Usuário Comum</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <ShieldCheck className="h-3 w-3" /> {roleLabels[p.role ?? 'user']}
                    </span>
                  )}
                  {savingId === p.id && <span className="text-xs text-muted-foreground shrink-0">Salvando...</span>}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}