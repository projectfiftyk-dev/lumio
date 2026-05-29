import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, Loader, Eye, EyeOff, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { getModules, deleteModule, patchModuleStatus, type ModuleResponse } from '../api/modules';
import { type PathResponse } from '../api/paths';
import { useApp } from '../context/AppContext';
import ModuleModal from './ModuleModal';
import ConfirmDialog from '../components/ConfirmDialog';

interface Props {
  path: PathResponse;
  onBack: () => void;
}

const VERTICAL_COLORS: Record<string, string> = {
  language: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  kids: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  learners: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  reader: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
};

interface ModuleRowProps {
  mod: ModuleResponse;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

function ModuleRow({ mod, isEditMode, onEdit, onDelete, onToggleStatus }: ModuleRowProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="lumio-card overflow-hidden">
      {/* Always-visible header row */}
      <div className="flex items-center gap-3 px-5 py-3">
        <span className="text-xs font-bold text-violet-300 dark:text-violet-600 flex-shrink-0 w-5 text-right">
          {mod.orderIndex + 1}
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#1A1839] dark:text-white text-sm truncate">{mod.title}</h3>
        </div>

        {isEditMode && (
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
            mod.status === 'published'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
          )}>
            {mod.status}
          </span>
        )}

        {isEditMode && (
          <div className="flex gap-0.5 flex-shrink-0">
            <button title={mod.status === 'published' ? 'Set to Draft' : 'Publish'} onClick={onToggleStatus} className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer">
              {mod.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onEdit} className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 text-violet-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 text-violet-300 dark:text-violet-600 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer flex-shrink-0"
        >
          <ChevronDown className={clsx('w-4 h-4 transition-transform duration-200', expanded && 'rotate-180')} />
        </button>
      </div>

      {/* Collapsible: thumbnail + body */}
      {expanded && (
        <>
          {mod.thumbnail && (
            <div className="w-full h-[20vh] bg-[#F5F3FF] dark:bg-[#0f0e1a] border-t border-[#E2DFFF] dark:border-[#2d2b47]">
              <img src={mod.thumbnail} alt={mod.title} className="w-full h-full object-contain" />
            </div>
          )}

          <div className="border-t border-[#E2DFFF] dark:border-[#2d2b47] px-5 py-4">
            {mod.description && (
              <p className="text-xs text-violet-400 dark:text-violet-500 mb-4">{mod.description}</p>
            )}
            <div className="flex items-center justify-center py-5">
              <p className="text-xs text-violet-300 dark:text-violet-700">Books will appear here</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ModulesView({ path, onBack }: Props) {
  const { isEditMode } = useApp();
  const [modules, setModules] = useState<ModuleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ModuleResponse | null>(null);
  const [deleting, setDeleting] = useState<ModuleResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { load(); }, [path.id]);

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
      <div className="flex items-center justify-between mb-6">
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

        {isEditMode && (
          <button onClick={() => setShowCreate(true)} className="lumio-btn-primary text-sm py-2.5 flex items-center gap-2 flex-shrink-0 ml-4">
            <Plus className="w-4 h-4" />
            Add Module
          </button>
        )}
      </div>

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
              isEditMode={isEditMode}
              onEdit={() => setEditing(mod)}
              onDelete={() => setDeleting(mod)}
              onToggleStatus={() => toggleModuleStatus(mod)}
            />
          ))}
        </div>
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
