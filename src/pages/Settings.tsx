import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAgendaStore } from '@/stores/agendaStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  fireBrowserNotification,
  notificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications'
import { playNotificationSound } from '@/lib/notificationSound'
import { Moon, Sun, User, Palette, LogOut, Bell, BellRing, BellOff } from 'lucide-react'
import { motion } from 'framer-motion'

export function Settings() {
  const { isDark, toggleDark, user, signOut } = useAuthStore()
  const { users, fetchUsers } = useAgendaStore()
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setPermission(notificationPermission())
  }, [])

  const currentUser = users.find((u) => u.id === user?.id)

  const handleEnableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission()
    setPermission(notificationPermission())
    if (granted) {
      fireBrowserNotification({
        title: 'Notificações ativadas',
        body: 'Você receberá alertas das suas atividades na hora marcada.',
        tag: 'agenda-enabled',
      })
      setNotice(null)
    } else {
      setNotice('Permissão negada no navegador. Habilite as notificações do site para receber alertas das atividades.')
    }
  }, [])

  const handleTestNotification = useCallback(() => {
    const shown = fireBrowserNotification({
      title: 'Teste de notificação',
      body: 'Se você está vendo isto, as notificações funcionam!',
      tag: `agenda-test-${Date.now()}`,
      onShow: () => playNotificationSound(),
    })
    if (!shown) {
      playNotificationSound()
    }
    setNotice(shown ? null : 'Permita as notificações do navegador para testar.')
  }, [])

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
              <Bell className="h-4 w-4 text-brand-blue" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Notificação do navegador</p>
                <p className="text-xs text-muted-foreground">
                  {permission === 'granted' && (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <BellRing className="h-3.5 w-3.5" /> Ativadas
                    </span>
                  )}
                  {permission === 'default' &&
                    'Permita para receber alertas na hora das atividades.'}
                  {permission === 'denied' && (
                    <span className="inline-flex items-center gap-1 text-red-500">
                      <BellOff className="h-3.5 w-3.5" /> Bloqueadas no navegador
                    </span>
                  )}
                  {permission === null && 'Não suportado neste navegador.'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleTestNotification}>
                  Testar
                </Button>
                {permission !== 'granted' && (
                  <Button size="sm" onClick={handleEnableNotifications}>
                    Ativar notificações
                  </Button>
                )}
              </div>
            </div>
            {notice && (
              <p className="mt-3 text-xs text-muted-foreground border-l-2 border-amber-500 pl-2">
                {notice}
              </p>
            )}
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
              <Palette className="h-4 w-4 text-brand-blue" />
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
        transition={{ delay: 0.3, duration: 0.3 }}
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
