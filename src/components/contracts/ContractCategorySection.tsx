import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Package, Plus, Trash2, X } from 'lucide-react'
import type { ContractCategory, ContractProduct } from '@/types'
import { motion } from 'framer-motion'
import { ContractProductRow } from './ContractProductRow'

interface Props {
  category: ContractCategory
  addingProduct: boolean
  prodName: string
  prodQty: string
  prodSold: string
  uploading: string | null
  onToggleAddProduct: () => void
  onChangeProdName: (value: string) => void
  onChangeProdQty: (value: string) => void
  onChangeProdSold: (value: string) => void
  onAddProduct: (categoryId: string) => void
  onCancelAddProduct: () => void
  onDeleteCategory: (id: string) => void
  onUpload: (productId: string) => void
  onOpenInvoice: (productId: string) => void
  onEditProduct: (product: ContractProduct) => void
  onDeleteProduct: (id: string) => void
}

export function ContractCategorySection({
  category,
  addingProduct,
  prodName,
  prodQty,
  prodSold,
  uploading,
  onToggleAddProduct,
  onChangeProdName,
  onChangeProdQty,
  onChangeProdSold,
  onAddProduct,
  onCancelAddProduct,
  onDeleteCategory,
  onUpload,
  onOpenInvoice,
  onEditProduct,
  onDeleteProduct,
}: Props) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm flex items-center gap-1">
          <Package className="h-3 w-3 text-brand-blue" /> {category.name}
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`Adicionar produto em ${category.name}`} onClick={onToggleAddProduct}>
            <Plus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" aria-label={`Excluir categoria ${category.name}`} onClick={() => onDeleteCategory(category.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {category.products && category.products.length > 0 && (
        <div className="space-y-1.5">
          {category.products.map((prod) => (
            <ContractProductRow
              key={prod.id}
              product={prod}
              uploading={uploading === prod.id}
              onUpload={onUpload}
              onOpenInvoice={onOpenInvoice}
              onEdit={onEditProduct}
              onDelete={onDeleteProduct}
            />
          ))}
        </div>
      )}

      {addingProduct && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[120px]">
            <Label className="text-[10px]">Produto</Label>
            <Input value={prodName} onChange={(e) => onChangeProdName(e.target.value)} placeholder="Nome" className="h-8 text-sm" />
          </div>
          <div className="w-16">
            <Label className="text-[10px]">Pendente</Label>
            <Input type="number" value={prodQty} onChange={(e) => onChangeProdQty(e.target.value)} placeholder="0" className="h-8 text-sm" />
          </div>
          <div className="w-16">
            <Label className="text-[10px]">Entregue</Label>
            <Input type="number" value={prodSold} onChange={(e) => onChangeProdSold(e.target.value)} placeholder="0" className="h-8 text-sm" />
          </div>
          <div className="flex gap-1">
            <Button size="sm" className="h-8" onClick={() => onAddProduct(category.id)} disabled={!prodName.trim()}>
              <Plus className="h-3 w-3" /> Add
            </Button>
            <Button size="sm" variant="outline" className="h-8" aria-label="Cancelar adição de produto" onClick={onCancelAddProduct}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}