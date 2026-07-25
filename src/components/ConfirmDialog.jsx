export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Підтвердити',
  cancelLabel = 'Скасувати',
  confirming = false,
  error,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-lg p-5 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        <p className="text-sm text-zinc-400 whitespace-pre-line">{message}</p>
        {error && (
          <p className="text-sm bg-red-950 border border-red-800 text-red-300 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancel}
            disabled={confirming}
            className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="px-4 py-2 rounded-md bg-red-700 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-60"
          >
            {confirming ? 'Зачекайте...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
