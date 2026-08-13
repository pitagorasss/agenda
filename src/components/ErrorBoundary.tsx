import { Component, type ReactNode } from 'react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 text-card-foreground shadow">
            <h1 className="text-lg font-bold">Algo deu errado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ocorreu um erro inesperado na aplicação. Recarregue a página para continuar.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-brand-green px-4 text-sm font-medium text-white shadow hover:bg-[#00b85e]"
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}