import { Button } from '@/components/ui/button'
import { FileText, Pencil, Upload, X } from 'lucide-react'
import type { ContractProduct } from '@/types'

interface Props {
  product: ContractProduct
  uploading: boolean
  onUpload: (productId: string) => void
  onOpenInvoice: (productId: string) => void
  onEdit: (product: ContractProduct) => void
  onDelete: (productId: string) => void
}

export function ContractProductRow({ product, uploading, onUpload, onOpenInvoice, onEdit, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between text-sm pl-3 border-l-2 border-brand-green/30 py-1">
      <div className="flex-1 min-w-0">
        <span className="font-medium">{product.name}</span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
          <span>Pendente: {product.quantity} un</span>
          <span>Entregue: {product.quantity_sold} un</span>
          <span className="text-brand-green font-medium">
            {(product.quantity_sold > 0 && (product.quantity + product.quantity_sold) > 0) ? 'Rendimento: ' + ((product.quantity_sold / (product.quantity + product.quantity_sold)) * 100).toFixed(1) + '%' : ''}
          </span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        {product.invoice_url ? (
          <Button variant="outline" size="sm" className="h-7 text-xs border-brand-blue text-brand-blue" onClick={() => onOpenInvoice(product.id)}>
            <FileText className="h-3.5 w-3.5" /> Nota
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="h-7 text-xs border-dashed" onClick={() => onUpload(product.id)}>
            {uploading ? '...' : <><Upload className="h-3.5 w-3.5" /> Anexar</>}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`Editar produto ${product.name}`} onClick={() => onEdit(product)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" aria-label={`Excluir produto ${product.name}`} onClick={() => onDelete(product.id)}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}