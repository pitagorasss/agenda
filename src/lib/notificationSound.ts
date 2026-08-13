const SOUND_URL = '/efeito-sonoro-notificacaopush.mp3'

let audio: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'auto'
    audio.src = SOUND_URL
  }
  return audio
}

/** Pre-carrega o arquivo de som para o toque nao travar no meio. */
export function preloadNotificationSound() {
  if (typeof window === 'undefined') return
  try {
    getAudio().load()
  } catch {
    //
  }
}

export function playNotificationSound() {
  try {
    const el = getAudio()
    if (!el.paused) {
      try {
        el.pause()
      } catch {
        //
      }
    }
    // Reinicia do inicio somente se ja tocou (evita erro antes do carregamento).
    if (el.currentTime > 0) {
      try {
        el.currentTime = 0
      } catch {
        //
      }
    }
    const promise = el.play()
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        // Autoplay pode ser bloqueado antes da primeira interacao. Ignorado.
      })
    }
  } catch {
    //
  }
}