// Componente de botão reutilizável, estilizado com Tailwind e variantes.
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot' // Permite o botão renderizar outro componente filho (asChild).
import { cva, type VariantProps } from 'class-variance-authority' // Biblioteca para variantes de estilo.
import { cn } from '@/lib/utils' // Combina classes CSS.

// Define as variantes visuais (estilos) e tamanhos do botão.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90', // Padrão.
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700', // Exclusão/perigo.
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground', // Contorno.
        secondary: 'bg-brand-green text-white shadow-sm hover:bg-[#00b85e]', // Secundário (verde da marca).
        ghost: 'hover:bg-accent hover:text-accent-foreground', // Transparente.
        link: 'text-brand-blue underline-offset-4 hover:underline', // Estilo de link.
      },
      size: {
        default: 'h-9 px-4 py-2', // Tamanho padrão.
        sm: 'h-8 rounded-md px-3 text-xs', // Pequeno.
        lg: 'h-10 rounded-md px-8', // Grande.
        icon: 'h-9 w-9', // Apenas ícone.
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

// Props do botão: atributos nativos + variantes + opção asChild.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean // Se true, o botão vira o componente filho (ex.: Link do router).
}

// Componente do botão com suporte a ref.
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button' // Escolhe entre Slot (filho) ou <button>.
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
