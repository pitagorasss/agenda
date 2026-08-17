// Componente de classe que captura erros de renderização dos filhos
// e mostra uma tela de erro amigável em vez de deixar o app quebrar.
import { Component, type ReactNode } from 'react'

// Estado do boundary: guarda o erro capturado (ou null).
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  // Método do React chamado quando um filho lança um erro durante a renderização.
  static getDerivedStateFromError(error: Error): State {
    return { error } // Salva o erro no estado.
  }

  render() {
    if (this.state.error) {
      // Tela de erro com mensagem e botão para recarregar a página.
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 text-card-foreground shadow">
            <h1 className="text-lg font-bold">Algo deu errado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ocorreu um erro inesperado na aplicação. Recarregue a página para continuar.
            </p>
            {/* Exibe a mensagem do erro (para fins de diagnóstico). */}
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()} // Recarrega a página.
              className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700"
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children // Sem erro: renderiza os filhos normalmente.
  }
}