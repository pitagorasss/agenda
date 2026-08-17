// Barra lateral (menu) de navegação, que expande/recolhe ao passar o mouse.
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom' // Navegação e detecção da rota atual.
import { LayoutDashboard, Calendar, Users, Settings, LogOut, BarChart3, TrendingUp, PieChart, CalendarClock } from 'lucide-react' // Ícones.
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion' // Animações.
import { useAuthStore } from '@/stores/authStore' // Store de autenticação (para logout).

// Definição dos links do menu (rota, rótulo e ícone).
const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/rotina', label: 'Rotina', icon: CalendarClock },
  { to: '/users', label: 'Usuários', icon: Users },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/statistics', label: 'Estatística', icon: PieChart },
  { to: '/evolution', label: 'Evolução', icon: TrendingUp },
  { to: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const location = useLocation() // Rota atual (para destacar o link ativo).
  const [expanded, setExpanded] = useState(false) // Controla se a barra está expandida.
  const signOut = useAuthStore((s) => s.signOut) // Função de logout.

  return (
    <motion.aside
      animate={{ width: expanded ? 224 : 64 }} // Anima a largura (expandida ou recolhida).
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => setExpanded(true)} // Expande ao passar o mouse.
      onMouseLeave={() => setExpanded(false)} // Recolhe ao sair.
      className="border-r bg-card hidden md:flex flex-col overflow-hidden"
    >
      {/* Cabeçalho com o logo da marca. */}
      <div className="flex h-14 items-center justify-center border-b shrink-0 px-3">
        <img
          src="/LOGO_TRAVESSIA.png"
          alt="Logo Travessia"
          className="h-8 w-auto object-contain object-left"
          style={{ width: expanded ? 'auto' : '32px', minWidth: '32px' }}
        />
      </div>
      {/* Lista de navegação. */}
      <nav className="flex flex-col gap-1 p-3 pt-4 flex-1 overflow-hidden">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to // Verifica se é a rota atual.
          return (
            <NavLink
              key={to}
              to={to}
              title={!expanded ? label : undefined} // Mostra o rótulo como tooltip quando recolhido.
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                !expanded && 'justify-center px-0',
                isActive
                  ? 'text-brand-blue' // Destaque para a rota ativa.
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {/* Fundo animado do item ativo. */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-brand-blue/10 dark:bg-brand-blue/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="h-4 w-4 relative z-10 shrink-0" />
              {/* Texto do link aparece com fade quando expandido. */}
              <AnimatePresence mode="wait">
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative z-10 whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          )
        })}
      </nav>
      {/* Rodapé com o botão de sair. */}
      <div className="border-t p-3">
        <button
          type="button"
          onClick={() => signOut()}
          title={!expanded ? 'Sair' : undefined}
          className={cn(
            'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
            !expanded && 'justify-center px-0',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <AnimatePresence mode="wait">
            {expanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}