import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Moon, Sun, LogOut, Building2, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

interface Props {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: Props) {
  const { isDark, toggleDark, signOut, user } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <motion.div whileTap={{ scale: 0.9 }} className="md:hidden">
            <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          </motion.div>
          <Building2 className="h-6 w-6 text-brand-green hidden sm:block" />
          <span className="text-lg font-bold bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">
            Agenda
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground hidden sm:block mr-2">
            {user?.email}
          </span>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="icon" onClick={toggleDark} className="relative">
              <motion.div
                key={isDark ? 'moon' : 'sun'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.div>
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </header>
  )
}