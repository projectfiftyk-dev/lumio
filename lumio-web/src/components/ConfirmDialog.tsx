import { X } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({ title, message, onConfirm, onCancel, loading }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative lumio-card p-6 w-full max-w-sm mx-4 z-10">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-[#1A1839] dark:text-white text-base">{title}</h3>
          <button onClick={onCancel} className="text-violet-300 dark:text-violet-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-violet-500 dark:text-violet-400 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="lumio-btn-ghost text-sm py-2 px-4">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold rounded-xl px-4 py-2 text-sm transition-all duration-200 cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
