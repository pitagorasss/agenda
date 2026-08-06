import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { format, addMonths, addYears } from 'date-fns'
import type { Contract } from '@/types'

interface Props {
  open: boolean
  renewalPeriod: Contract['renewal_period']
  customDays: string
  onChangePeriod: (value: Contract['renewal_period']) => void
  onChangeCustomDays: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function ContractRenewDialog({
  open,
  renewalPeriod,
  customDays,
  onChangePeriod,
  onChangeCustomDays,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renovar Contrato</DialogTitle>
          <DialogDescription>Confirme a renovação do contrato.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Periodicidade</Label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            value={renewalPeriod}
            onChange={(e) => onChangePeriod(e.target.value as Contract['renewal_period'])}
          >
            <option value="6months">6 meses</option>
            <option value="1year">1 ano</option>
            <option value="custom">Personalizado</option>
          </select>
          {renewalPeriod === 'custom' && (
            <div>
              <Label>Dias</Label>
              <Input type="number" value={customDays} onChange={(e) => onChangeCustomDays(e.target.value)} />
            </div>
          )}
          <p className="text-sm text-muted-foreground pt-2">
            Novo vencimento:{' '}
            <strong>
              {format(
                renewalPeriod === '6months' ? addMonths(new Date(), 6) :
                renewalPeriod === '1year' ? addYears(new Date(), 1) :
                new Date(Date.now() + (Number(customDays) || 30) * 86400000),
                'dd/MM/yyyy'
              )}
            </strong>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onConfirm}>Confirmar Renovação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}