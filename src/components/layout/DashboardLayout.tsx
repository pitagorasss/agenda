// Layout principal das páginas logadas: barra lateral (desktop) + cabeçalho (mobile) + conteúdo.
import { Outlet, NavLink } from 'react-router-dom' // Outlet renderiza a página da rota filha.
import { Sidebar } from './Sidebar' // Barra lateral do desktop.
import { LayoutDashboard, Calendar, Users, Settings, LogOut, TrendingUp, PieChart, CalendarClock } from 'lucide-react' // Ícones.
import { useAuthStore } from '@/stores/authStore' // Store de autenticação (para logout).
import { cn } from '@/lib/utils'

// Links de navegação exibidos no cabeçalho mobile.
const mobileLinks = [
  { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/rotina', label: 'Rotina', icon: CalendarClock },
  { to: '/evolution', label: 'Evolução', icon: TrendingUp },
  { to: '/statistics', label: 'Estatística', icon: PieChart },
  { to: '/users', label: 'Usuários', icon: Users },
  { to: '/settings', label: 'Ajustes', icon: Settings },
]

export function DashboardLayout() {
  const signOut = useAuthStore((s) => s.signOut) // Função de logout.

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar /> {/* Menu lateral (visível em telas médias/grandes). */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabeçalho superior apenas no mobile, com logo e atalhos. */}
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
                      ? 'bg-brand-blue/10 text-brand-blue' // Destaca a rota ativa.
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
              </NavLink>
            ))}
            {/* Botão de sair no mobile. */}
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
        {/* Área de conteúdo rolável: renderiza a página da rota atual. */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}