import { Modal } from '../ui/Modal'
import { Button } from '../ui'

type ConfirmDialogProps = {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  title = 'Confirme a ação',
  description = 'Tem certeza que deseja prosseguir? Esta ação não pode ser desfeita.',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} description={description} size="sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel} type="button">
          {cancelLabel}
        </Button>
        <Button variant="primary" onClick={onConfirm} loading={loading} type="button">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
