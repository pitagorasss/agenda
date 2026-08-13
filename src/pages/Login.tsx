import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export function Login() {
  const { signIn, signUp } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const err = isSignUp ? await signUp(email, password) : await signIn(email, password)
    if (err) setError(err)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-green/5 via-background to-brand-blue/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex justify-center">
          <img
            src="/LOGO_TRAVESSIA.png"
            alt="Logo Travessia"
            className="h-10 w-auto"
          />
        </div>
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
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
