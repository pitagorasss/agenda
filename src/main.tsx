// Arquivo de entrada principal do React: inicializa a aplicação no navegador.
import { StrictMode } from 'react' // Modo estrito do React, que detecta problemas em tempo de desenvolvimento.
import { createRoot } from 'react-dom/client' // Função que monta o React no DOM.
import { Toaster } from 'sonner' // Componente que exibe notificações/toasts na tela.
import App from './App' // Componente raiz da aplicação.
import { ErrorBoundary } from '@/components/ErrorBoundary' // Componente que captura erros de renderização.
import './index.css' // Estilos globais (Tailwind CSS).

// Cria a raiz do React no elemento <div id="root"> do index.html e renderiza a árvore da aplicação.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App /> {/* Componente principal da aplicação. */}
      {/* Renderiza os toasts (notificações) no canto superior direito. */}
      <Toaster position="top-right" richColors />
    </ErrorBoundary>
  </StrictMode>,
)