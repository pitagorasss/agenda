// Componente de área de texto (textarea) com opção de auto-crescimento.
import * as React from 'react'
import { cn } from '@/lib/utils'

// Textarea que cresce automaticamente quando autoGrow está ativo.
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { autoGrow?: boolean }>(
  ({ className, autoGrow, onChange, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null) // Referência interna ao elemento.

    // Combina a ref interna com a ref recebida por prop.
    const handleRef = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    // Ajusta a altura do textarea ao conteúdo (sem barra de rolagem).
    const resize = (el: HTMLTextAreaElement | null) => {
      if (!el) return
      el.style.height = 'auto' // Zera para recalcular.
      el.style.height = `${el.scrollHeight}px` // Define a nova altura conforme o conteúdo.
    }

    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={handleRef}
        onChange={(e) => {
          if (autoGrow) resize(e.target) // Redimensiona ao digitar (se habilitado).
          onChange?.(e) // Propaga o evento para o componente pai.
        }}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }