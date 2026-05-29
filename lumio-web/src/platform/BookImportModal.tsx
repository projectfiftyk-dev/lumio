import { useRef, useState } from 'react';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { previewBookYaml, confirmBookYaml, type BookPreviewResponse, type BookResponse } from '../api/books';

interface Props {
  moduleId: string;
  nextOrderIndex: number;
  onClose: () => void;
  onImported: (b: BookResponse) => void;
}

const fieldClass =
  'w-full rounded-xl px-4 py-2.5 text-sm bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] text-[#1A1839] dark:text-violet-100 placeholder:text-violet-300 dark:placeholder:text-violet-700 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors';

export default function BookImportModal({ moduleId, nextOrderIndex, onClose, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BookPreviewResponse | null>(null);
  const [orderIndex, setOrderIndex] = useState(nextOrderIndex);
  const [required, setRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setError(null);
    setLoading(true);
    try {
      const result = await previewBookYaml(moduleId, f);
      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!file) return;
    setConfirming(true);
    setError(null);
    try {
      const result = await confirmBookYaml(moduleId, file, orderIndex, required);
      onImported(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative lumio-card p-6 w-full max-w-md mx-4 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1A1839] dark:text-white text-lg">Import Book from YAML</h2>
          <button
            onClick={onClose}
            className="text-violet-300 dark:text-violet-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File drop zone */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={clsx(
            'w-full rounded-xl border-2 border-dashed px-4 py-8 flex flex-col items-center gap-2 transition-colors cursor-pointer',
            file
              ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/20'
              : 'border-[#E2DFFF] dark:border-[#2d2b47] hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20',
          )}
        >
          {file ? (
            <>
              <FileText className="w-6 h-6 text-violet-500" />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-300">{file.name}</span>
              <span className="text-xs text-violet-400">Click to replace</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-violet-300 dark:text-violet-600" />
              <span className="text-sm text-violet-400 dark:text-violet-500">Click to select a YAML file</span>
            </>
          )}
        </button>
        <input ref={inputRef} type="file" accept=".yaml,.yml" className="hidden" onChange={handleFileChange} />

        {loading && (
          <p className="text-xs text-violet-400 dark:text-violet-500 mt-4 text-center">Parsing YAML…</p>
        )}

        {/* Preview card */}
        {preview && (
          <div className="mt-4 rounded-xl bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] p-4 space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">YAML parsed successfully</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-bold text-[#1A1839] dark:text-white">{preview.title}</p>
              {preview.author && (
                <p className="text-xs text-violet-500 dark:text-violet-400">by {preview.author}</p>
              )}
              {preview.description && (
                <p className="text-xs text-violet-400 dark:text-violet-500 line-clamp-2">{preview.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {preview.language && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                  {preview.language}
                </span>
              )}
              {preview.level && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                  {preview.level}
                </span>
              )}
              {preview.sceneCount != null && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {preview.sceneCount} scenes
                </span>
              )}
              {preview.nodeCount != null && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  {preview.nodeCount} nodes
                </span>
              )}
            </div>

            {preview.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {preview.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-[#E2DFFF] dark:bg-[#2d2b47] text-violet-600 dark:text-violet-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confirm options */}
        {preview && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Order</label>
                <input
                  type="number"
                  min={0}
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  className={fieldClass}
                />
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[#1A1839] dark:text-violet-200">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="w-4 h-4 accent-violet-600"
                  />
                  Required
                </label>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="lumio-btn-ghost flex-1 text-sm py-2.5">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!preview || confirming}
            className={clsx('lumio-btn-primary flex-1 text-sm py-2.5', (!preview || confirming) && 'opacity-60')}
          >
            {confirming ? 'Importing…' : 'Import book'}
          </button>
        </div>
      </div>
    </div>
  );
}
