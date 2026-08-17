// Página de Configurações: notificações do navegador, tema claro/escuro e conta do usuário.
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
import { supabase } from '@/lib/supabase'
import { Moon, Sun, User, Palette, LogOut, Bell, BellRing, BellOff, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function Settings() {
  const { isDark, toggleDark, user, signOut } = useAuthStore() // Preferências e sessão.
  const { users, fetchUsers } = useAgendaStore()
  const [permission, setPermission] = useState<NotificationPermission | null>(null) // Estado da permissão de notificação.
  const [notice, setNotice] = useState<string | null>(null) // Mensagem de aviso.

  // Carrega os usuários ao montar.
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Lê a permissão atual de notificação.
  useEffect(() => {
    setPermission(notificationPermission())
  }, [])

  const currentUser = users.find((u) => u.id === user?.id) // Dados completos do usuário logado.

  // Pede permissão e ativa as notificações.
  const handleEnableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission()
    setPermission(notificationPermission())
    if (granted) {
      // Dispara uma notificação de confirmação.
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

  // Dispara uma notificação de teste (e som).
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

  // Chama o RPC "send_test_completion_notification" do Supabase, que simula a notificação de tarefa concluída.
  const handleTestCompletionNotification = useCallback(async () => {
    const { error } = await supabase.rpc('send_test_completion_notification')
    if (error) {
      setNotice(`Falha ao enviar: ${error.message}`)
      return
    }
    setNotice('Notificação de conclusão enviada. Verifique o banner do navegador e o som.')
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

      {/* Bloco de Notificações. */}
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
                {/* Exibe o status da permissão. */}
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
              {/* Botões de testar e ativar. */}
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
            {/* Mensagem de aviso, se houver. */}
            {notice && (
              <p className="mt-3 text-xs text-muted-foreground border-l-2 border-amber-500 pl-2">
                {notice}
              </p>
            )}
            {/* Teste da notificação de tarefa concluída. */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Notificação de tarefa concluída</p>
                <p className="text-xs text-muted-foreground">
                  Simula a notificação que quem designou a tarefa recebe quando ela é concluída.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleTestCompletionNotification}>
                <CheckCircle2 className="h-4 w-4" /> Testar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bloco de Aparência (tema). */}
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
              {/* Botão de alternância de tema. */}
              <Button variant="outline" size="icon" onClick={toggleDark}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bloco da Conta. */}
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
            {/* Botão de sair da conta. */}
            <Button variant="outline" className="mt-4" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
