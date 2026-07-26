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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm bg-stone-950 border border-stone-700 rounded-lg p-5 flex flex-col gap-4">
        <h2 className="text-xl text-amber-50">{title}</h2>
        <p className="text-sm text-stone-400 whitespace-pre-line">{message}</p>
        {error && (
          <p className="text-sm bg-red-950 border border-red-800 text-red-300 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancel}
            disabled={confirming}
            className="px-4 py-2 rounded-md border border-stone-700 hover:border-stone-500 text-stone-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {confirming ? 'Зачекайте...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
