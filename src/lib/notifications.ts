const ICON = '/LOGO_TRAVESSIA.png'
const BADGE = '/favicon.svg'

export interface BrowserNotificationOptions {
  title: string
  body?: string
  tag: string
  onShow?: () => void
}

/**
 * Solicita permissao para notificacoes do navegador.
 * Deve ser chamado a partir de um gesto do usuario (clique) para funcionar
 * em todos os navegadores.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}

export function notificationPermission(): NotificationPermission | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  return Notification.permission
}

/**
 * Exibe o banner silencioso do navegador. Retorna true se foi exibido.
 * O callback onShow e chamado quando o banner fica visivel no sistema,
 * permitindo alinhar o som com a exibicao.
 */
export function fireBrowserNotification({ title, body, tag, onShow }: BrowserNotificationOptions): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false
  try {
    const notification = new Notification(title, {
      body,
      icon: ICON,
      badge: BADGE,
      tag,
      silent: true,
    } as NotificationOptions)
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    let shown = false
    const notifyShown = () => {
      if (shown) return
      shown = true
      onShow?.()
    }
    notification.onshow = notifyShown
    // Fallback caso o evento onshow nao dispare no navegador.
    setTimeout(notifyShown, 1000)
    return true
  } catch {
    return false
  }
}