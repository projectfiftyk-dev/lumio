import { useRef, useState } from 'react';
import { X, FileText, Upload } from 'lucide-react';
import clsx from 'clsx';
import ThumbnailUploader from '../components/ThumbnailUploader';
import { createBook, updateBook, previewBookYaml, type BookResponse, type BookRequest } from '../api/books';
import type { ContentStatus } from '../api/paths';

interface Props {
  pathId: string;
  moduleId: string;
  existing?: BookResponse;
  nextOrderIndex: number;
  onClose: () => void;
  onSaved: (b: BookResponse) => void;
}

const fieldClass =
  'w-full rounded-xl px-4 py-2.5 text-sm bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] text-[#1A1839] dark:text-violet-100 placeholder:text-violet-300 dark:placeholder:text-violet-700 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors';

export default function BookModal({ pathId, moduleId, existing, nextOrderIndex, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [author, setAuthor] = useState(existing?.author ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [language, setLanguage] = useState(existing?.language ?? '');
  const [level, setLevel] = useState(existing?.level ?? '');
  const [durationMinutes, setDurationMinutes] = useState<string>(
    existing?.durationMinutes != null ? String(existing.durationMinutes) : '',
  );
  const [required, setRequired] = useState(existing?.required ?? false);
  const [orderIndex, setOrderIndex] = useState(existing?.orderIndex ?? nextOrderIndex);
  const [status, setStatus] = useState<ContentStatus>(existing?.status ?? 'draft');
  const [coverImageKey, setCoverImageKey] = useState<string | null>(existing?.coverImageKey ?? null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(existing?.coverImageUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YAML load state
  const yamlInputRef = useRef<HTMLInputElement>(null);
  const [yamlLoading, setYamlLoading] = useState(false);
  const [yamlFile, setYamlFile] = useState<File | null>(null);

  async function handleYamlLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setYamlFile(f);
    setYamlLoading(true);
    try {
      const preview = await previewBookYaml(pathId, moduleId, f);
      if (preview.title) setTitle(preview.title);
      if (preview.author) setAuthor(preview.author);
      if (preview.description) setDescription(preview.description);
      if (preview.language) setLanguage(preview.language);
      if (preview.level) setLevel(preview.level);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'YAML load failed');
    } finally {
      setYamlLoading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const data: BookRequest = {
      title: title.trim(),
      author: author.trim() || undefined,
      description: description.trim() || undefined,
      language: language.trim() || undefined,
      level: level.trim() || undefined,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      required,
      orderIndex,
      status,
      coverImageKey: coverImageKey ?? undefined,
    };
    try {
      const result = existing
        ? await updateBook(pathId, moduleId, existing.id, data)
        : await createBook(pathId, moduleId, data);
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
            {existing ? 'Edit Book' : 'New Book'}
          </h2>
          <button
            onClick={onClose}
            className="text-violet-300 dark:text-violet-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Load from YAML */}
        <div className="mb-4 p-3 rounded-xl bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47]">
          <p className="text-xs font-medium text-violet-500 dark:text-violet-400 mb-2">Load metadata from YAML</p>
          <button
            type="button"
            onClick={() => yamlInputRef.current?.click()}
            disabled={yamlLoading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-[#E2DFFF] dark:border-[#2d2b47] text-xs text-violet-400 dark:text-violet-500 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer disabled:opacity-60"
          >
            {yamlLoading ? (
              <span>Parsing…</span>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                {yamlFile ? yamlFile.name : 'Select YAML file'}
              </>
            )}
          </button>
          {yamlFile && !yamlLoading && (
            <p className="text-xs text-emerald-500 mt-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Fields pre-filled from YAML
            </p>
          )}
          <input ref={yamlInputRef} type="file" accept=".yaml,.yml" className="hidden" onChange={handleYamlLoad} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ThumbnailUploader
            value={coverImageKey}
            previewUrl={coverImageUrl}
            onChange={(key, url) => { setCoverImageKey(key); setCoverImageUrl(url); }}
            onClear={() => { setCoverImageKey(null); setCoverImageUrl(null); }}
          />

          <div>
            <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Book title"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description"
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Language</label>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. en"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Level</label>
              <input
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="e.g. A1"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">
                Duration (min)
              </label>
              <input
                type="number"
                min={0}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="—"
                className={fieldClass}
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className={`${fieldClass} cursor-pointer`}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
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

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="lumio-btn-ghost flex-1 text-sm py-2.5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className={clsx('lumio-btn-primary flex-1 text-sm py-2.5', saving && 'opacity-60')}
            >
              {saving ? 'Saving…' : existing ? 'Save changes' : 'Create book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
