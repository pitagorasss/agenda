// Arquivo de configuração do Vite (bundler usado para desenvolvimento e build da aplicação).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Plugin que adiciona suporte a React (HMR e JSX) no Vite.
import tailwindcss from '@tailwindcss/vite' // Plugin que integra o Tailwind CSS ao Vite.
import path from 'path' // Módulo do Node.js para trabalhar com caminhos de arquivos.

export default defineConfig({
  plugins: [react(), tailwindcss()], // Ativa os plugins de React e Tailwind.
  resolve: {
    alias: {
      // Cria o atalho "@" que aponta para a pasta "src",
      // permitindo imports como "@/components/...".
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
})