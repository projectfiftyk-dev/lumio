import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, Loader } from 'lucide-react';
import clsx from 'clsx';
import { getCharacters, deleteCharacter, type CharacterResponse } from '../api/characters';
import { useApp } from '../context/AppContext';
import CharacterModal from './CharacterModal';
import ConfirmDialog from '../components/ConfirmDialog';

interface Props {
  pathId: string;
}

function CharacterCard({
  character,
  isEditMode,
  onEdit,
  onDelete,
}: {
  character: CharacterResponse;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="lumio-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-[#1A1839] dark:text-white text-sm leading-snug">{character.name}</h4>
          <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300 font-mono">
            {character.slug}
          </span>
        </div>
        {isEditMode && (
          <div className="flex gap-0.5 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-violet-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {character.description && (
        <p className="text-xs text-violet-400 dark:text-violet-500 line-clamp-2">{character.description}</p>
      )}
      {character.personality && (
        <p className="text-xs text-violet-300 dark:text-violet-600 italic line-clamp-2">"{character.personality}"</p>
      )}
    </div>
  );
}

export default function CharactersView({ pathId }: Props) {
  const { isEditMode } = useApp();
  const [characters, setCharacters] = useState<CharacterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CharacterResponse | null>(null);
  const [deleting, setDeleting] = useState<CharacterResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { load(); }, [pathId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const all = await getCharacters(pathId);
      setCharacters(all.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load characters');
    } finally {
      setLoading(false);
    }
  }

  function handleSaved(c: CharacterResponse) {
    setCharacters((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = c;
        return next.sort((a, b) => a.name.localeCompare(b.name));
      }
      return [...prev, c].sort((a, b) => a.name.localeCompare(b.name));
    });
    setShowCreate(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteCharacter(pathId, deleting.id);
      setCharacters((prev) => prev.filter((c) => c.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wider">
          Characters
        </h2>
        {isEditMode && (
          <button
            onClick={() => setShowCreate(true)}
            className="lumio-btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Character
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader className="w-5 h-5 text-violet-400 animate-spin" />
        </div>
      )}

      {error && <div className="lumio-card p-3 text-xs text-red-500">{error}</div>}

      {!loading && !error && characters.length === 0 && (
        <div className={clsx(
          'flex flex-col items-center justify-center py-10 text-center rounded-xl border-2 border-dashed',
          'border-[#E2DFFF] dark:border-[#2d2b47]',
        )}>
          <Users className="w-8 h-8 text-violet-200 dark:text-violet-800 mb-2" />
          <p className="text-xs text-violet-300 dark:text-violet-700">
            {isEditMode ? 'No characters yet. Add one to get started.' : 'No characters defined for this path.'}
          </p>
        </div>
      )}

      {!loading && !error && characters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {characters.map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              isEditMode={isEditMode}
              onEdit={() => setEditing(c)}
              onDelete={() => setDeleting(c)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CharacterModal pathId={pathId} onClose={() => setShowCreate(false)} onSaved={handleSaved} />
      )}
      {editing && (
        <CharacterModal pathId={pathId} existing={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete character"
          message={`"${deleting.name}" will be permanently deleted. Books referencing this character by slug may break.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
