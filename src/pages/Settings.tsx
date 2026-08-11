import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAgendaStore } from '@/stores/agendaStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Moon, Sun, User, Palette, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'

export function Settings() {
  const { isDark, toggleDark, user, signOut } = useAuthStore()
  const { users, fetchUsers } = useAgendaStore()

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const currentUser = users.find((u) => u.id === user?.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Preferências do sistema</p>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-brand-green" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Modo escuro</p>
                <p className="text-xs text-muted-foreground">Alternar entre tema claro e escuro</p>
              </div>
              <Button variant="outline" size="icon" onClick={toggleDark}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-brand-blue" />
              Sua Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0.5">
              <p className="text-base font-semibold">{currentUser?.name ?? user?.email}</p>
              {currentUser?.name && (
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              )}
            </div>
            <Button variant="outline" className="mt-4" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
