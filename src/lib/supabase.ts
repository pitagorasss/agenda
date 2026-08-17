// Configura e exporta o cliente do Supabase, usado em todo o app para autenticação e banco de dados.
import { createClient } from '@supabase/supabase-js'

// Lê as credenciais do Supabase a partir das variáveis de ambiente definidas no arquivo .env.
// O fallback para string vazia evita erro de build, mas as queries só funcionarão com o .env configurado.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Cria e exporta o cliente único (singleton) do Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
