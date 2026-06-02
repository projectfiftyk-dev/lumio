import { useEffect, useState } from 'react';
import {
  Plus, Upload, Pencil, Trash2, Eye, EyeOff, BookOpen, Loader,
  Clock, Globe, Lock, Wand2, ShieldCheck, RefreshCw, CheckCircle2,
  XCircle, AlertTriangle, Archive,
} from 'lucide-react';
import clsx from 'clsx';
import {
  getBooks,
  deleteBook,
  patchBookStatus,
  validateBook,
  type BookResponse,
  type BookValidationResponse,
} from '../api/books';
import BookModal from './BookModal';
import BookImportModal from './BookImportModal';
import ScriptEditorModal from './ScriptEditorModal';
import ConfirmDialog from '../components/ConfirmDialog';

interface Props {
  pathId: string;
  moduleId: string;
  isEditMode: boolean;
}

function StatusBadge({ status }: { status: BookResponse['status'] }) {
  return (
    <span
      className={clsx(
        'text-xs px-2 py-0.5 rounded-full font-medium',
        status === 'published'
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
          : status === 'archived'
          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
      )}
    >
      {status}
    </span>
  );
}

function ValidationModal({
  result,
  onClose,
}: {
  result: BookValidationResponse;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative lumio-card p-6 w-full max-w-md mx-4 z-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {result.ready ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <h2 className="font-bold text-[#1A1839] dark:text-white text-lg">
              {result.ready ? 'Book is ready' : 'Validation failed'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-violet-300 dark:text-violet-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>

        {result.structuralErrors.length > 0 && (
          <div className="mb-4 space-y-1.5">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Errors (blocking)</p>
            {result.structuralErrors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {e}
              </div>
            ))}
          </div>
        )}

        {result.warnings.length > 0 && (
          <div className="mb-4 space-y-1.5">
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Warnings</p>
            {result.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {w}
              </div>
            ))}
          </div>
        )}

        {Object.keys(result.checklist).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wider">Checklist</p>
            {Object.entries(result.checklist).map(([key, done]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                {done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-violet-300 dark:text-violet-600 flex-shrink-0" />
                )}
                <span className={done ? 'text-[#1A1839] dark:text-violet-200' : 'text-violet-400 dark:text-violet-500'}>
                  {key.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookCard({
  book,
  isEditMode,
  onOpen,
  onEditMeta,
  onDelete,
  onToggleStatus,
  onValidate,
  onReimport,
}: {
  book: BookResponse;
  isEditMode: boolean;
  onOpen: () => void;
  onEditMeta: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onValidate: () => void;
  onReimport: () => void;
}) {
  const canOpen = isEditMode && book.status !== 'archived';

  return (
    <div className="lumio-card overflow-hidden w-full max-w-sm flex flex-col">
      {/* Clickable body — opens script editor (or metadata form if no yaml) */}
      <div
        onClick={canOpen ? onOpen : undefined}
        className={clsx(
          'flex-1',
          canOpen && 'cursor-pointer group',
        )}
      >
        {book.coverImageUrl && (
          <div className="relative overflow-hidden">
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className={clsx('w-full h-40 object-cover transition-transform duration-200', canOpen && 'group-hover:scale-[1.02]')}
            />
          </div>
        )}

        <div className={clsx('p-4 space-y-2', canOpen && 'group-hover:bg-violet-50/40 dark:group-hover:bg-violet-950/10 transition-colors duration-150')}>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-[#1A1839] dark:text-white text-sm leading-snug flex-1">{book.title}</h4>
            {book.required && (
              <Lock className="w-3.5 h-3.5 text-violet-400 dark:text-violet-500 flex-shrink-0 mt-0.5" />
            )}
          </div>

          {book.author && (
            <p className="text-xs text-violet-500 dark:text-violet-400">by {book.author}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {book.language && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                <Globe className="w-2.5 h-2.5" />
                {book.language}
              </span>
            )}
            {book.level && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                {book.level}
              </span>
            )}
            {book.durationMinutes != null && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Clock className="w-2.5 h-2.5" />
                {book.durationMinutes} min
              </span>
            )}
          </div>

          {book.description && (
            <p className="text-xs text-violet-400 dark:text-violet-500 line-clamp-2">{book.description}</p>
          )}
        </div>
      </div>

      {/* Action bar — always stops propagation so button clicks don't trigger card open */}
      {isEditMode && (
        <div
          className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-[#E2DFFF] dark:border-[#2d2b47]"
          onClick={(e) => e.stopPropagation()}
        >
          <StatusBadge status={book.status} />
          <div className="flex gap-0.5">
            {book.yamlKey && (
              <button
                title="Validate book"
                onClick={onValidate}
                className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {book.yamlKey && book.status !== 'archived' && (
              <button
                title="Re-import YAML"
                onClick={onReimport}
                className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              title={book.status === 'published' ? 'Set to Draft' : book.status === 'archived' ? 'Archived' : 'Publish'}
              onClick={onToggleStatus}
              disabled={book.status === 'archived'}
              className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {book.status === 'published' ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : book.status === 'archived' ? (
                <Archive className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              title="Edit metadata"
              onClick={onEditMeta}
              disabled={book.status === 'archived'}
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
          </div>
        </div>
      )}
    </div>
  );
}

export default function BooksSection({ pathId, moduleId, isEditMode }: Props) {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<BookResponse | null>(null);
  const [deleting, setDeleting] = useState<BookResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reimporting, setReimporting] = useState<BookResponse | null>(null);
  const [editingScript, setEditingScript] = useState<BookResponse | null>(null);
  const [validating, setValidating] = useState<BookResponse | null>(null);
  const [validationResult, setValidationResult] = useState<BookValidationResponse | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);

  useEffect(() => { load(); }, [moduleId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const all = await getBooks(pathId, moduleId);
      setBooks(all.sort((a, b) => a.orderIndex - b.orderIndex));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load books');
    } finally {
      setLoading(false);
    }
  }

  const visible = isEditMode ? books : books.filter((b) => b.status === 'published');

  function handleSaved(b: BookResponse) {
    setBooks((prev) => {
      const idx = prev.findIndex((x) => x.id === b.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = b;
        return next.sort((a, b) => a.orderIndex - b.orderIndex);
      }
      return [...prev, b].sort((a, b) => a.orderIndex - b.orderIndex);
    });
    setShowCreate(false);
    setShowImport(false);
    setShowEditor(false);
    setEditing(null);
    setReimporting(null);
    setEditingScript(null);
  }

  async function toggleStatus(book: BookResponse) {
    const next = book.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await patchBookStatus(pathId, moduleId, book.id, next);
      setBooks((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)).sort((a, b) => a.orderIndex - b.orderIndex),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Status update failed');
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteBook(pathId, moduleId, deleting.id);
      setBooks((prev) => prev.filter((b) => b.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleValidate(book: BookResponse) {
    setValidating(book);
    setValidationResult(null);
    setValidationLoading(true);
    try {
      const result = await validateBook(pathId, moduleId, book.id);
      setValidationResult(result);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Validation failed');
      setValidating(null);
    } finally {
      setValidationLoading(false);
    }
  }

  const nextOrderIndex = books.length > 0 ? Math.max(...books.map((b) => b.orderIndex)) + 1 : 0;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {loading && <Loader className="w-5 h-5 text-violet-400 animate-spin" />}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-4">
          <BookOpen className="w-8 h-8 text-violet-200 dark:text-violet-800" />
          <p className="text-xs text-violet-300 dark:text-violet-700">
            {isEditMode ? 'No books yet. Add or import one.' : 'No published books yet.'}
          </p>
        </div>
      )}

      {!loading &&
        visible.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            isEditMode={isEditMode}
            onOpen={() => setEditingScript(book)}
            onEditMeta={() => setEditing(book)}
            onDelete={() => setDeleting(book)}
            onToggleStatus={() => toggleStatus(book)}
            onValidate={() => handleValidate(book)}
            onReimport={() => setReimporting(book)}
          />
        ))}

      {isEditMode && (
        <div className="flex gap-2 mt-2 flex-wrap justify-center">
          <button
            onClick={() => setShowCreate(true)}
            className="lumio-btn-ghost text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Book
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="lumio-btn-ghost text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Import YAML
          </button>
          <button
            onClick={() => setShowEditor(true)}
            className="lumio-btn-ghost text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Write Script
          </button>
        </div>
      )}

      {/* Validation loading indicator */}
      {validationLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="relative lumio-card px-6 py-4 flex items-center gap-3">
            <Loader className="w-4 h-4 text-violet-500 animate-spin" />
            <span className="text-sm text-violet-600 dark:text-violet-300">Validating…</span>
          </div>
        </div>
      )}

      {showCreate && (
        <BookModal
          pathId={pathId}
          moduleId={moduleId}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setShowCreate(false)}
          onSaved={handleSaved}
        />
      )}
      {showImport && (
        <BookImportModal
          pathId={pathId}
          moduleId={moduleId}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setShowImport(false)}
          onImported={handleSaved}
        />
      )}
      {reimporting && (
        <BookImportModal
          pathId={pathId}
          moduleId={moduleId}
          existingBook={reimporting}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setReimporting(null)}
          onImported={handleSaved}
        />
      )}
      {editing && (
        <BookModal
          pathId={pathId}
          moduleId={moduleId}
          existing={editing}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
      {showEditor && (
        <ScriptEditorModal
          pathId={pathId}
          moduleId={moduleId}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setShowEditor(false)}
          onSaved={handleSaved}
        />
      )}
      {editingScript && (
        <ScriptEditorModal
          pathId={pathId}
          moduleId={moduleId}
          existing={editingScript}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setEditingScript(null)}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete book"
          message={`"${deleting.title}" will be permanently deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
      {validationResult && validating && (
        <ValidationModal
          result={validationResult}
          onClose={() => { setValidationResult(null); setValidating(null); }}
        />
      )}
    </div>
  );
}
