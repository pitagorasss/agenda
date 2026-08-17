// Ponto de entrada do aplicativo: define o roteamento, proteção de rotas,
// carregamento preguiçoso das páginas e animações de transição.
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Login } from '@/pages/Login'
import { useTaskNotifications } from '@/hooks/useTaskNotifications'
import { AnimatePresence, motion } from 'framer-motion'

// Carregamento preguiçoso das páginas (só baixa o JS quando a rota for acessada).
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Agenda = lazy(() => import('@/pages/Agenda').then((m) => ({ default: m.Agenda })))
const Users = lazy(() => import('@/pages/Users').then((m) => ({ default: m.Users })))
const Reports = lazy(() => import('@/pages/Reports').then((m) => ({ default: m.Reports })))
const Evolution = lazy(() => import('@/pages/Evolution').then((m) => ({ default: m.Evolution })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))
const Rotina = lazy(() => import('@/pages/Rotina').then((m) => ({ default: m.Rotina })))
const Statistics = lazy(() => import('@/pages/Statistics').then((m) => ({ default: m.Statistics })))

// Spinner exibido enquanto a página preguiçosa carrega.
function Loader() {
  return (
    <div className="flex h-40 items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="h-8 w-8 rounded-full border-4 border-brand-blue border-t-transparent"
      />
    </div>
  )
}

// Rota protegida: redireciona para o login se não houver usuário logado,
// e ativa o agendamento de notificações de tarefas.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  useTaskNotifications()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Transição animada: envolve as rotas do dashboard em AnimatePresence,
// animando a troca de página conforme a URL muda.
function AnimatedOutlet() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {/* Rotas internas do dashboard (cada uma com suspense + loader). */}
        <Routes location={location}>
          <Route path="/dashboard" element={<Suspense fallback={<Loader />}><Dashboard /></Suspense>} />
          <Route path="/agenda" element={<Suspense fallback={<Loader />}><Agenda /></Suspense>} />
          <Route path="/rotina" element={<Suspense fallback={<Loader />}><Rotina /></Suspense>} />
          <Route path="/users" element={<Suspense fallback={<Loader />}><Users /></Suspense>} />
          <Route path="/reports" element={<Suspense fallback={<Loader />}><Reports /></Suspense>} />
          <Route path="/statistics" element={<Suspense fallback={<Loader />}><Statistics /></Suspense>} />
          <Route path="/evolution" element={<Suspense fallback={<Loader />}><Evolution /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<Loader />}><Settings /></Suspense>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

// Define as rotas principais, aguardando a restauração da sessão.
function AppRoutes() {
  const { loading } = useAuth()
  const user = useAuthStore((s) => s.user)

  // Tela de carregamento enquanto verifica a sessão.
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="h-8 w-8 rounded-full border-4 border-brand-blue border-t-transparent"
        />
      </div>
    )
  }

  return (
    <Routes>
      {/* Login: redireciona para o dashboard se já estiver logado. */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      {/* Rotas protegidas envolvidas pelo layout do dashboard. */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/*" element={<AnimatedOutlet />} />
      </Route>
      {/* Qualquer outra rota vai para o dashboard. */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

// Componente raiz do app.
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
