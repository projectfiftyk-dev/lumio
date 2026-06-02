import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, Loader, Eye, EyeOff, ChevronDown, Users } from 'lucide-react';
import clsx from 'clsx';
import { getModules, deleteModule, patchModuleStatus, type ModuleResponse } from '../api/modules';
import { type PathResponse } from '../api/paths';
import { useApp } from '../context/AppContext';
import ModuleModal from './ModuleModal';
import BooksSection from './BooksSection';
import CharactersView from './CharactersView';
import ConfirmDialog from '../components/ConfirmDialog';

interface Props {
  path: PathResponse;
  onBack: () => void;
}

const VERTICAL_COLORS: Record<string, string> = {
  language: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  kids: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  learners: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  reader: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
};

interface ModuleRowProps {
  mod: ModuleResponse;
  pathId: string;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

function ModuleRow({ mod, pathId, isEditMode, onEdit, onDelete, onToggleStatus }: ModuleRowProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="lumio-card overflow-hidden">
      {mod.thumbnail && (
        <div className="relative w-full h-20 overflow-hidden">
          <img src={mod.thumbnail} alt={mod.title} className="w-full h-full object-cover" />
          <button
            onClick={() => setExpanded((v) => !v)}
            className="absolute top-2 right-2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-lg transition-colors cursor-pointer backdrop-blur-sm"
          >
            <ChevronDown className={clsx('w-4 h-4 transition-transform duration-200', expanded && 'rotate-180')} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3 gap-3">
        <h3 className="font-bold text-[#1A1839] dark:text-white text-sm text-center flex-1">{mod.title}</h3>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          {isEditMode && (
            <>
              <span
                className={clsx(
                  'text-xs px-2 py-0.5 rounded-full font-medium mr-1',
                  mod.status === 'published'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : mod.status === 'archived'
                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
                )}
              >
                {mod.status}
              </span>
              <button
                title={mod.status === 'published' ? 'Set to Draft' : 'Publish'}
                onClick={onToggleStatus}
                disabled={mod.status === 'archived'}
                className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {mod.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onEdit}
                disabled={mod.status === 'archived'}
                className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 text-violet-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {!mod.thumbnail && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-violet-300 dark:text-violet-600 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronDown className={clsx('w-4 h-4 transition-transform duration-200', expanded && 'rotate-180')} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#E2DFFF] dark:border-[#2d2b47] px-5 pb-5">
          {mod.description && (
            <p className="text-xs text-violet-400 dark:text-violet-500 text-center pt-4 pb-2">{mod.description}</p>
          )}
          <BooksSection pathId={pathId} moduleId={mod.id} isEditMode={isEditMode} />
        </div>
      )}
    </div>
  );
}

type Tab = 'modules' | 'characters';

export default function ModulesView({ path, onBack }: Props) {
  const { isEditMode } = useApp();
  const [tab, setTab] = useState<Tab>('modules');
  const [modules, setModules] = useState<ModuleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ModuleResponse | null>(null);
  const [deleting, setDeleting] = useState<ModuleResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { if (tab === 'modules') load(); }, [path.id, tab]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const all = await getModules(path.id);
      setModules(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  }

  const visible = isEditMode ? modules : modules.filter((m) => m.status === 'published');

  function handleSaved(m: ModuleResponse) {
    setModules((prev) => {
      const idx = prev.findIndex((x) => x.id === m.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = m; return next.sort((a, b) => a.orderIndex - b.orderIndex); }
      return [...prev, m].sort((a, b) => a.orderIndex - b.orderIndex);
    });
    setShowCreate(false);
    setEditing(null);
  }

  async function toggleModuleStatus(mod: ModuleResponse) {
    const next = mod.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await patchModuleStatus(path.id, mod.id, next);
      setModules((prev) => prev.map((m) => m.id === updated.id ? updated : m).sort((a, b) => a.orderIndex - b.orderIndex));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Status update failed');
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteModule(path.id, deleting.id);
      setModules((prev) => prev.filter((m) => m.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  }

  const nextOrderIndex = modules.length > 0 ? Math.max(...modules.map((m) => m.orderIndex)) + 1 : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-violet-500 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Paths
          </button>
          <span className="text-violet-300 dark:text-violet-700">/</span>
          <h1 className="text-xl font-bold text-[#1A1839] dark:text-white truncate">{path.title}</h1>
          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0', VERTICAL_COLORS[path.vertical])}>
            {path.vertical}
          </span>
        </div>

        {isEditMode && tab === 'modules' && (
          <button onClick={() => setShowCreate(true)} className="lumio-btn-primary text-sm py-2.5 flex items-center gap-2 flex-shrink-0 ml-4">
            <Plus className="w-4 h-4" />
            Add Module
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#F5F3FF] dark:bg-[#1a1833] border border-[#E2DFFF] dark:border-[#2d2b47] w-fit mb-6">
        <button
          onClick={() => setTab('modules')}
          className={clsx(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            tab === 'modules'
              ? 'bg-white dark:bg-[#12112a] text-violet-700 dark:text-violet-300 shadow-sm'
              : 'text-violet-400 dark:text-violet-600 hover:text-violet-600 dark:hover:text-violet-400',
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Modules
        </button>
        <button
          onClick={() => setTab('characters')}
          className={clsx(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            tab === 'characters'
              ? 'bg-white dark:bg-[#12112a] text-violet-700 dark:text-violet-300 shadow-sm'
              : 'text-violet-400 dark:text-violet-600 hover:text-violet-600 dark:hover:text-violet-400',
          )}
        >
          <Users className="w-3.5 h-3.5" />
          Characters
        </button>
      </div>

      {/* Characters tab */}
      {tab === 'characters' && <CharactersView pathId={path.id} />}

      {/* Modules tab */}
      {tab === 'modules' && (
        <>
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
          )}

          {error && <div className="lumio-card p-4 text-sm text-red-500">{error}</div>}

          {!loading && !error && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="w-10 h-10 text-violet-200 dark:text-violet-800 mb-3" />
              <p className="text-violet-400 dark:text-violet-500 text-sm">
                {isEditMode ? 'No modules yet. Add one to get started.' : 'No published modules available yet.'}
              </p>
            </div>
          )}

          {!loading && !error && visible.length > 0 && (
            <div className="space-y-3">
              {visible.map((mod) => (
                <ModuleRow
                  key={mod.id}
                  mod={mod}
                  pathId={path.id}
                  isEditMode={isEditMode}
                  onEdit={() => setEditing(mod)}
                  onDelete={() => setDeleting(mod)}
                  onToggleStatus={() => toggleModuleStatus(mod)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showCreate && (
        <ModuleModal pathId={path.id} nextOrderIndex={nextOrderIndex} onClose={() => setShowCreate(false)} onSaved={handleSaved} />
      )}
      {editing && (
        <ModuleModal pathId={path.id} existing={editing} nextOrderIndex={nextOrderIndex} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete module"
          message={`"${deleting.title}" will be permanently deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
