import { useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { createCharacter, updateCharacter, type CharacterResponse, type CharacterRequest } from '../api/characters';

interface Props {
  pathId: string;
  existing?: CharacterResponse;
  onClose: () => void;
  onSaved: (c: CharacterResponse) => void;
}

const fieldClass =
  'w-full rounded-xl px-4 py-2.5 text-sm bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] text-[#1A1839] dark:text-violet-100 placeholder:text-violet-300 dark:placeholder:text-violet-700 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors';

const SLUG_RE = /^[a-z0-9_]+$/;

export default function CharacterModal({ pathId, existing, onClose, onSaved }: Props) {
  const [slug, setSlug] = useState(existing?.slug ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [personality, setPersonality] = useState(existing?.personality ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugError = slug && !SLUG_RE.test(slug) ? 'Only lowercase letters, numbers, and underscores' : null;
  const isEdit = !!existing;

  function autoSlug(n: string) {
    if (isEdit) return;
    setSlug(n.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || slugError) return;
    setSaving(true);
    setError(null);
    const data: CharacterRequest = {
      slug: slug.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      personality: personality.trim() || undefined,
    };
    try {
      const result = isEdit
        ? await updateCharacter(pathId, existing.id, data)
        : await createCharacter(pathId, data);
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
            {isEdit ? 'Edit Character' : 'New Character'}
          </h2>
          <button
            onClick={onClose}
            className="text-violet-300 dark:text-violet-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Name *</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); autoSlug(e.target.value); }}
              required
              placeholder="Character name"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">
              Slug *
              {isEdit && <span className="ml-1 text-violet-300 dark:text-violet-600">(locked)</span>}
            </label>
            <input
              value={slug}
              onChange={(e) => { if (!isEdit) setSlug(e.target.value); }}
              required
              readOnly={isEdit}
              placeholder="e.g. aria_teacher"
              className={clsx(fieldClass, isEdit && 'opacity-60 cursor-not-allowed')}
            />
            {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
            {!isEdit && !slugError && slug && (
              <p className="text-xs text-violet-400 mt-1">Will be used as identifier in YAML</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of the character"
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-violet-500 dark:text-violet-400 mb-1.5">Personality</label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              rows={3}
              placeholder="Personality traits, speaking style, tone…"
              className={`${fieldClass} resize-none`}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="lumio-btn-ghost flex-1 text-sm py-2.5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !slug.trim() || !!slugError}
              className={clsx('lumio-btn-primary flex-1 text-sm py-2.5', saving && 'opacity-60')}
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
