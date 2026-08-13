import { Outlet, NavLink } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { LayoutDashboard, Calendar, Users, Settings, LogOut, TrendingUp, PieChart } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const mobileLinks = [
  { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/evolution', label: 'Evolução', icon: TrendingUp },
  { to: '/statistics', label: 'Estatística', icon: PieChart },
  { to: '/users', label: 'Usuários', icon: Users },
  { to: '/settings', label: 'Ajustes', icon: Settings },
]

export function DashboardLayout() {
  const signOut = useAuthStore((s) => s.signOut)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="md:hidden flex items-center justify-between gap-2 border-b bg-card px-4 py-2">
          <img src="/LOGO_TRAVESSIA.png" alt="Logo Travessia" className="h-7 w-auto" />
          <nav className="flex items-center gap-1">
            {mobileLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                    isActive
                      ? 'bg-brand-green/10 text-brand-green'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
              </NavLink>
            ))}
            <button
              type="button"
              title="Sair"
              onClick={() => signOut()}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}