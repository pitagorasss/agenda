import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
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
        <Card>
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
              className="flex justify-center mb-2"
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-xl">Instituto Travessia</CardTitle>
            <CardDescription>Sistema ERP - Faça seu login</CardDescription>
          </CardHeader>
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
                className="text-brand-green hover:underline font-medium"
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
