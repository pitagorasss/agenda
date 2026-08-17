// Lida com notificações do navegador (banners do sistema).
const ICON = '/LOGO_TRAVESSIA.png' // Ícone exibido na notificação.
const BADGE = '/favicon.svg' // Badge (ícone pequeno) exibida em dispositivos que suportam o campo "badge" da API.

// Opções aceitas ao disparar uma notificação do navegador.
export interface BrowserNotificationOptions {
  title: string
  body?: string // Texto de apoio (opcional).
  tag: string // Identificador usado para agrupar/substituir notificações do mesmo tipo.
  onShow?: () => void // Callback chamado quando a notificação fica visível.
}

/**
 * Solicita permissão para notificações do navegador.
 * Deve ser chamado a partir de um gesto do usuário (clique) para funcionar
 * em todos os navegadores.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false // Sem suporte a notificações.
  if (Notification.permission === 'granted') return true // Já permitido.
  if (Notification.permission === 'denied') return false // Já negado.
  try {
    const result = await Notification.requestPermission() // Pede a permissão ao usuário.
    return result === 'granted'
  } catch {
    return false
  }
}

// Retorna a permissão atual de notificações (ou null se não houver suporte).
export function notificationPermission(): NotificationPermission | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  return Notification.permission
}

/**
 * Exibe o banner silencioso do navegador. Retorna true se foi exibido.
 * O callback onShow é chamado quando o banner fica visível no sistema,
 * permitindo alinhar o som com a exibição.
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
      silent: true, // Notificação sem som (o som é tocado separadamente).
    } as NotificationOptions)
    notification.onclick = () => {
      window.focus() // Foca a janela ao clicar na notificação.
      notification.close() // Fecha a notificação.
    }
    let shown = false
    const notifyShown = () => {
      if (shown) return
      shown = true
      onShow?.() // Dispara o callback uma única vez.
    }
    notification.onshow = notifyShown
    // Fallback caso o evento onshow não dispare no navegador.
    setTimeout(notifyShown, 1000)
    return true
  } catch {
    return false
  }
}