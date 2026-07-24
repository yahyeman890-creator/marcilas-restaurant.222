import { useState, type ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requireText?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  requireText,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');

  const blocked = requireText ? text.trim() !== requireText : false;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      setText('');
    }
  }

  function handleClose() {
    setText('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} size="sm">
      <div className="text-center py-2">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            destructive ? 'bg-red-100' : 'bg-amber-100'
          }`}
        >
          <AlertTriangle size={24} className={destructive ? 'text-red-600' : 'text-amber-600'} />
        </div>
        <div className="text-gray-700 mb-4 text-sm">{message}</div>
        {requireText && (
          <div className="mb-4 text-left">
            <p className="text-sm text-gray-500 mb-1.5">
              Type <span className="font-bold text-gray-700">{requireText}</span> to confirm:
            </p>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input"
              autoFocus
            />
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={handleClose} className="btn-secondary flex-1" disabled={loading}>
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || blocked}
            className={`${destructive ? 'btn-danger' : 'btn-primary'} flex-1`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
