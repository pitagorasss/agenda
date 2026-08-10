import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, Users, Settings, LogOut, BarChart3, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/users', label: 'Usuários', icon: Users },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/evolution', label: 'Evolução', icon: TrendingUp },
  { to: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const signOut = useAuthStore((s) => s.signOut)

  return (
    <motion.aside
      animate={{ width: expanded ? 224 : 64 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="border-r bg-card hidden md:flex flex-col overflow-hidden"
    >
      <nav className="flex flex-col gap-1 p-3 pt-4 flex-1 overflow-hidden">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              title={!expanded ? label : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                !expanded && 'justify-center px-0',
                isActive
                  ? 'text-brand-green'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-brand-green/10 dark:bg-brand-green/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="h-4 w-4 relative z-10 shrink-0" />
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