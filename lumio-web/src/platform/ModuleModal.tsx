import { useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import ThumbnailUploader from '../components/ThumbnailUploader';
import { createModule, updateModule, type ModuleResponse, type ModuleRequest } from '../api/modules';
import type { ContentStatus } from '../api/paths';

interface Props {
  pathId: string;
  existing?: ModuleResponse;
  nextOrderIndex: number;
  onClose: () => void;
  onSaved: (m: ModuleResponse) => void;
}

const fieldClass = 'w-full rounded-xl px-4 py-2.5 text-sm bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] text-[#1A1839] dark:text-violet-100 placeholder:text-violet-300 dark:placeholder:text-violet-700 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors';

export default function ModuleModal({ pathId, existing, nextOrderIndex, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [status, setStatus] = useState<ContentStatus>(existing?.status ?? 'draft');
  const [orderIndex, setOrderIndex] = useState(existing?.orderIndex ?? nextOrderIndex);
  const [thumbnailKey, setThumbnailKey] = useState<string | null>(existing?.thumbnailKey ?? null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(existing?.thumbnail ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const data: ModuleRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      orderIndex,
      thumbnail: thumbnailKey ?? undefined,
    };
    try {
      const result = existing ? await updateModule(pathId, existing.id, data) : await createModule(pathId, data);
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative lumio-card p-6 w-full max-w-md mx-4 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1A1839] dark:text-white text-lg">
            {existing ? 'Edit Module' : 'New Module'}
          </h2>
          <button onClick={onClose} className="text-violet-300 dark:text-violet-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ThumbnailUploader
            value={thumbnailKey}
            previewUrl={thumbnailUrl}
            onChange={(key, url) => { setThumbnailKey(key); setThumbnailUrl(url); }}
            onClear={() => { setThumbnailKey(null); setThumbnailUrl(null); }}
          />

          <div>
            <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Module title" className={fieldClass} />
          </div>

          <div>
            <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional description" className={`${fieldClass} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Order</label>
              <input type="number" min={0} value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Status *</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)} className={`${fieldClass} cursor-pointer`}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="lumio-btn-ghost flex-1 text-sm py-2.5">Cancel</button>
            <button type="submit" disabled={saving || !title.trim()} className={clsx('lumio-btn-primary flex-1 text-sm py-2.5', saving && 'opacity-60')}>
              {saving ? 'Saving…' : existing ? 'Save changes' : 'Create module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
