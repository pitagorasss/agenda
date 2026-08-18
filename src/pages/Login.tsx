// Página de login/cadastro usando a autenticação do Supabase.
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore' // Ações signIn/signUp do store de autenticação.
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion' // Animação de entrada.

export function Login() {
  const { signIn, signUp } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null) // Mensagem de erro do Supabase.
  const [isSignUp, setIsSignUp] = useState(false) // Alterna entre login e cadastro.

  // Envia o formulário: cadastra ou faz login conforme o modo atual.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const err = isSignUp ? await signUp(email, password) : await signIn(email, password)
    if (err) setError(err) // Guarda o erro retornado pelo Supabase para exibir abaixo.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-green/5 via-background to-brand-blue/5 p-4">
      {/* Cartão animado de autenticação. */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="w-full max-w-sm"
      >
        {/* Logo da marca. */}
        <div className="mb-6 flex justify-center">
          <img
            src="/LOGO_TRAVESSIA.png"
            alt="Logo Travessia"
            className="h-10 w-auto"
          />
        </div>
        <Card>
          <CardContent className="p-8 pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo de e-mail. */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              {/* Campo de senha. */}
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {/* Exibe o erro, se houver. */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md p-2"
                >
                  {error}
                </motion.p>
              )}
              <Button type="submit" className="w-full">
                {isSignUp ? 'Criar Conta' : 'Entrar'}
              </Button>
            </form>
            {/* Alterna entre login e cadastro. */}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null) }} // Limpa o erro ao trocar entre login e cadastro.
                className="text-brand-blue hover:underline font-medium"
              >
                {isSignUp ? 'Fazer login' : 'Criar conta'}
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
