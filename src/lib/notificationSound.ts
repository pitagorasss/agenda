const SOUND_URL = '/efeito-sonoro-notificacaopush.mp3'
const COMPLETION_SOUND_URL = '/somdenotificacaodeconclusao.mp3'

function makeSoundPlayer(url: string) {
  let audio: HTMLAudioElement | null = null

  function getAudio(): HTMLAudioElement {
    if (!audio) {
      audio = new Audio()
      audio.preload = 'auto'
      audio.src = url
    }
    return audio
  }

  /** Pre-carrega o arquivo de som para o toque nao travar no meio. */
  function preload() {
    if (typeof window === 'undefined') return
    try {
      getAudio().load()
    } catch {
      //
    }
  }

  function play() {
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

  return { preload, play }
}

const reminder = makeSoundPlayer(SOUND_URL)
const completion = makeSoundPlayer(COMPLETION_SOUND_URL)

export const preloadNotificationSound = reminder.preload
export const playNotificationSound = reminder.play
export const preloadCompletionNotificationSound = completion.preload
export const playCompletionNotificationSound = completion.play