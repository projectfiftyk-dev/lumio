import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen, Loader, Search, X, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { getPaths, deletePath, patchPathStatus, type PathResponse, type Vertical, type ContentStatus } from '../api/paths';
import { useApp } from '../context/AppContext';
import PathModal from './PathModal';
import ModulesView from './ModulesView';
import ConfirmDialog from '../components/ConfirmDialog';

const VERTICAL_COLORS: Record<string, string> = {
  language: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  kids: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  learners: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  reader: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
};

const VERTICAL_LABELS: Record<string, string> = {
  language: 'Language',
  kids: 'Kids',
  learners: 'Learners',
  reader: 'Reader',
};

export default function PathsView() {
  const { isEditMode } = useApp();
  const [paths, setPaths] = useState<PathResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<PathResponse | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PathResponse | null>(null);
  const [deleting, setDeleting] = useState<PathResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterVertical, setFilterVertical] = useState<Vertical | ''>('');
  const [filterStatus, setFilterStatus] = useState<ContentStatus | ''>('');

  useEffect(() => { load(); }, [search, filterVertical, filterStatus]);
  useEffect(() => { load(); }, [isEditMode]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await getPaths({
        search: search || undefined,
        vertical: filterVertical || undefined,
        status: isEditMode ? (filterStatus || undefined) : 'published',
      });
      setPaths(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load paths');
    } finally {
      setLoading(false);
    }
  }

  function handleSaved(p: PathResponse) {
    setPaths((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = p; return next; }
      return [p, ...prev];
    });
    setShowCreate(false);
    setEditing(null);
  }

  async function togglePathStatus(path: PathResponse) {
    const next = path.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await patchPathStatus(path.id, next);
      setPaths((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Status update failed');
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deletePath(deleting.id);
      setPaths((prev) => prev.filter((p) => p.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (selectedPath) {
    return <ModulesView path={selectedPath} onBack={() => setSelectedPath(null)} />;
  }

  const inputClass = 'bg-white dark:bg-[#1a1833] border border-[#E2DFFF] dark:border-[#2d2b47] text-[#1A1839] dark:text-violet-100 placeholder:text-violet-300 dark:placeholder:text-violet-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors';

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1A1839] dark:text-white">Paths</h1>
        {isEditMode && (
          <button onClick={() => setShowCreate(true)} className="lumio-btn-primary text-sm py-2.5 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Path
          </button>
        )}
      </div>

      {/* Filters */}
      {isEditMode && (
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-300 dark:text-violet-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search paths…"
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-sm ${inputClass}`}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-300 hover:text-violet-500 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value as Vertical | '')}
            className={`rounded-xl px-3 py-2 text-sm cursor-pointer ${inputClass}`}
          >
            <option value="">All verticals</option>
            <option value="language">Language</option>
            <option value="kids">Kids</option>
            <option value="learners">Learners</option>
            <option value="reader">Reader</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ContentStatus | '')}
            className={`rounded-xl px-3 py-2 text-sm cursor-pointer ${inputClass}`}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      )}

      {error && <div className="lumio-card p-4 text-sm text-red-500">{error}</div>}

      {!loading && !error && paths.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="w-10 h-10 text-violet-200 dark:text-violet-800 mb-3" />
          <p className="text-violet-400 dark:text-violet-500 text-sm">
            {isEditMode ? 'No paths yet. Create your first one.' : 'No published paths available yet.'}
          </p>
        </div>
      )}

      {!loading && !error && paths.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paths.map((path) => (
            <div
              key={path.id}
              className="lumio-card overflow-hidden group hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700 transition-all duration-200"
            >
              {/* Thumbnail */}
              <div
                className="bg-[#F5F3FF] dark:bg-[#0f0e1a] flex items-center justify-center cursor-pointer relative"
                onClick={() => setSelectedPath(path)}
              >
                {path.thumbnail ? (
                  <img
                    src={path.thumbnail}
                    alt={path.title}
                    className="w-full object-contain"
                  />
                ) : (
                  <div className="h-40 w-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-violet-200 dark:text-violet-800" />
                  </div>
                )}
                {isEditMode && (
                  <span className={clsx(
                    'absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium',
                    path.status === 'published'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400'
                  )}>
                    {path.status}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3
                    className="font-semibold text-[#1A1839] dark:text-violet-100 text-sm cursor-pointer hover:text-violet-700 dark:hover:text-violet-300 transition-colors line-clamp-1"
                    onClick={() => setSelectedPath(path)}
                  >
                    {path.title}
                  </h3>
                  {isEditMode && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      <button
                        title={path.status === 'published' ? 'Set to Draft' : 'Publish'}
                        onClick={(e) => { e.stopPropagation(); togglePathStatus(path); }}
                        className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        {path.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditing(path); }}
                        className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleting(path); }}
                        className="p-1.5 text-violet-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', VERTICAL_COLORS[path.vertical])}>
                  {VERTICAL_LABELS[path.vertical]}
                </span>

                {path.description && (
                  <p className="text-xs text-violet-400 dark:text-violet-500 mt-2 line-clamp-2">{path.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <PathModal onClose={() => setShowCreate(false)} onSaved={handleSaved} />}
      {editing && <PathModal existing={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
      {deleting && (
        <ConfirmDialog
          title="Delete path"
          message={`"${deleting.title}" and all its modules will be permanently deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
