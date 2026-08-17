// Toca os efeitos sonoros de notificação e de conclusão de tarefa.
const SOUND_URL = '/efeito-sonoro-notificacaopush.mp3' // Som de lembrete/notificação.
const COMPLETION_SOUND_URL = '/somdenotificacaodeconclusao.mp3' // Som de tarefa concluída.

// Cria um "player" de áudio reutilizável para um arquivo de som.
function makeSoundPlayer(url: string) {
  let audio: HTMLAudioElement | null = null // Instância de áudio criada sob demanda.

  // Retorna (e cria se necessário) o elemento de áudio com o som carregado.
  function getAudio(): HTMLAudioElement {
    if (!audio) {
      audio = new Audio()
      audio.preload = 'auto' // Pré-carrega o som para tocar sem travar.
      audio.src = url
    }
    return audio
  }

  // Pré-carrega o arquivo de som para o toque não travar no meio.
  function preload() {
    if (typeof window === 'undefined') return
    try {
      getAudio().load() // Inicia o carregamento do áudio.
    } catch {
      /* Erro ignorado de propósito: áudio indisponível ou autoplay bloqueado. */
    }
  }

  // Toca o som, reiniciando do início se já estiver tocando.
  function play() {
    try {
      const el = getAudio()
      if (!el.paused) {
        try {
          el.pause() // Pausa se estiver tocando.
        } catch {
          /* Erro ignorado: pausar pode falhar se o áudio não estiver carregado. */
        }
      }
      // Reinicia do início somente se já tocou (evita erro antes do carregamento).
      if (el.currentTime > 0) {
        try {
          el.currentTime = 0
        } catch {
          /* Erro ignorado: reposicionar pode falhar antes do carregamento completo. */
        }
      }
      const promise = el.play()
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {
          // Autoplay pode ser bloqueado antes da primeira interação. Ignorado.
        })
      }
    } catch {
      /* Erro ignorado: tocar o áudio pode ser bloqueado pelo navegador. */
    }
  }

  return { preload, play }
}

// Instancia os dois players: um para o lembrete e outro para a conclusão.
const reminder = makeSoundPlayer(SOUND_URL)
const completion = makeSoundPlayer(COMPLETION_SOUND_URL)

// Exporta as funções de pré-carregar e tocar cada som.
export const preloadNotificationSound = reminder.preload
export const playNotificationSound = reminder.play
export const preloadCompletionNotificationSound = completion.preload
export const playCompletionNotificationSound = completion.play