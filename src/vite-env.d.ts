/// <reference types="vite/client" /> <!-- Referência aos tipos do Vite (ex.: import.meta.env). -->

// Declaração dos tipos das variáveis de ambiente usadas pela aplicação.
// Isso garante que import.meta.env tenha autocompleção e verificação de tipos.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string // URL do projeto Supabase.
  readonly VITE_SUPABASE_ANON_KEY: string // Chave pública (anon) do Supabase.
}

interface ImportMeta {
  readonly env: ImportMetaEnv // Expõe as variáveis acima via import.meta.env.
}
