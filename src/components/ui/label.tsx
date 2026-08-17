// Componente de rótulo (label) baseado no Radix UI, para acessibilidade de formulários.
import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label' // Primitiva de label do Radix.
import { cva, type VariantProps } from 'class-variance-authority' // Utilitário de estilos (por ora apenas classes base, sem variantes).
import { cn } from '@/lib/utils'

// Estilo base do label.
const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
)

// Label reutilizável.
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
